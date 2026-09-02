import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getPublishedMockTests, startMockTest } from '@/api/userService';
import { Clock, FileText, Star, ArrowRight, Trophy, Sparkles, Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { LockedSection, LOCKED_COPY } from '@/components/LockedSection';

export const MockExam = () => {
  const { sections, samples, loading: accessLoading } = useAccess();
  const [tests, setTests]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null); // id of test being started
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getPublishedMockTests()
      .then(res => setTests(res.data?.data ?? res.data ?? []))
      .catch(() => setError('Failed to load exams.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (test) => {
    setStarting(test.id);
    try {
      const res = await startMockTest(test.id);
      const { attempt_id } = res.data;
      navigate(`/mock-exam/${test.id}/attempt/${attempt_id}`);
    } catch (err) {
      // Backend sends { message, attempt_id } when attempt already exists
      const existingId = err.response?.data?.attempt_id;
      if (existingId) {
        navigate(`/mock-exam/${test.id}/attempt/${existingId}`);
      }
    } finally {
      setStarting(null);
    }
  };

  // The server already refuses these requests; this turns the refusal into
  // something a student can act on instead of an empty page. Rendering the
  // locked state while access is still loading would flash a paywall at people
  // who have paid, so loading is its own branch.
  if (accessLoading) {
    return (
      <DashboardLayout active="mock-exam">
        <div className="p-16 text-center text-sm text-slate-400">Loading…</div>
      </DashboardLayout>
    );
  }

  // A free sample exam is worth more than any description of one: the student
  // sits it, sees a real score, and knows what they would be buying. So the
  // page only closes when there is not even one.
  if (!sections.mocks && !samples.mocks) {
    return (
      <DashboardLayout active="mock-exam">
        <LockedSection {...LOCKED_COPY.mocks} sampleCount={samples.mocks} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="mock-exam">
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Mock Exams</h1>
            <p className="text-slate-500 text-sm mt-1">Full-length timed practice exams</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-24 text-red-400">{error}</div>
          ) : tests.length === 0 ? (
            <div className="text-center py-24">
              <Trophy className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400">No mock exams are available yet.</p>
              <p className="text-slate-300 text-sm mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tests.map(test => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-base font-semibold text-slate-900 leading-snug">{test.title}</h2>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                      test.test_type === 'dynamic'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {test.test_type === 'dynamic' ? 'Dynamic' : 'Fixed'}
                    </span>
                  </div>

                  {!sections.mocks && test.is_free && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      <Sparkles className="h-3 w-3" />
                      Free sample
                    </span>
                  )}

                  {test.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{test.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {test.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> {test.total_questions} Qs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" /> {test.total_marks} marks
                    </span>
                  </div>
                  {test.test_type === 'dynamic' && (
                    <p className="text-[11px] text-slate-400 -mt-3 mb-4 italic">
                      Actual question count is drawn live from the question pool.
                    </p>
                  )}

                  {/* An exam this student cannot sit must not offer to start —
                      the server would refuse, and a button that errors reads as
                      broken rather than as a paywall. */}
                  {sections.mocks || test.is_free ? (
                    <button
                      onClick={() => handleStart(test)}
                      disabled={starting === test.id}
                      className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl transition-colors"
                    >
                      {starting === test.id ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting…</>
                      ) : (
                        <>Start Test <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/pricing"
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
                    >
                      <Lock className="h-4 w-4" />
                      Included with a plan
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
