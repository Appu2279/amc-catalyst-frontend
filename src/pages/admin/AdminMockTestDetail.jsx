import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getMockTest,
  getQuestionsAdmin,
  addMockTestQuestions,
  removeMockTestQuestion,
  togglePublishMockTest,
  getSubjects,
} from '@/api/adminService';
import {
  ArrowLeft, Plus, Trash2, Search, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── SVG Mini Pie ──────────────────────────────────────────────────────────────
const MiniPie = ({ data }) => {
  const total = data.reduce((s, d) => s + d.v, 1);
  const cx = 50; const cy = 50; const r = 44;
  let angle = -Math.PI / 2;
  const slices = data.filter((d) => d.v > 0).map((d) => {
    const sweep = (d.v / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2} Z`, color: d.color, label: d.label, v: d.v };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={100} height={100}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth={2} />)}
      </svg>
      <div className="space-y-1">
        {data.filter((d) => d.v > 0).map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-500">{d.label}</span>
            <span className="font-semibold text-slate-800">{d.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Badge helpers ─────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) =>
  type === 'fixed' ? (
    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Fixed</span>
  ) : (
    <span className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">Dynamic</span>
  );

const DiffBadge = ({ d }) => {
  const cls = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cls[d] ?? 'bg-slate-100 text-slate-600'}`}>{d}</span>;
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {toast.message}
    </div>
  );
};

// ── Question picker (for fixed tests) ────────────────────────────────────────
const QuestionPicker = ({ testId, addedQuestions, onAdd, onRemove }) => {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    getSubjects().then((r) => setSubjects(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 10, is_active: true };
    if (search) params.search = search;
    if (subjectId) params.subject_id = subjectId;
    try {
      const res = await getQuestionsAdmin(params);
      setResults(res.data?.data ?? res.data?.questions ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, pages: 1 });
    } catch {} finally {
      setLoading(false);
    }
  }, [page, search, subjectId]);

  useEffect(() => { load(); }, [load]);

  const addedIds = new Set(addedQuestions.map((q) => q.question_id ?? q.id));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Search bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Search questions…"
            onChange={(e) => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 400);
            }}
          />
        </div>
        <select
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
          value={subjectId}
          onChange={(e) => { setSubjectId(e.target.value); setPage(1); }}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Results */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No questions found.</p>
        ) : (
          results.map((q) => {
            const added = addedIds.has(q.id);
            return (
              <div key={q.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 line-clamp-1">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {q.difficulty && <DiffBadge d={q.difficulty} />}
                    <span className="text-xs text-slate-400">{q.subject?.name}</span>
                  </div>
                </div>
                {added ? (
                  <button
                    onClick={() => onRemove(q.id)}
                    className="shrink-0 px-3 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => onAdd(q)}
                    className="shrink-0 px-3 py-1 text-xs text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" />Add
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-500">{pagination.total} questions</span>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs">{page}/{pagination.pages}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminMockTestDetail = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTest = useCallback(async () => {
    try {
      const res = await getMockTest(id);
      setTest(res.data?.data ?? res.data);
    } catch {
      showToast('error', 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTest(); }, [loadTest]);

  const handleAdd = async (q) => {
    const order = (test?.questions?.length ?? 0) + 1;
    try {
      await addMockTestQuestions(id, [{ question_id: q.id, question_order: order }]);
      showToast('success', 'Question added');
      loadTest();
    } catch {
      showToast('error', 'Failed to add question');
    }
  };

  const handleRemove = async (qId) => {
    try {
      await removeMockTestQuestion(id, qId);
      showToast('success', 'Question removed');
      loadTest();
    } catch {
      showToast('error', 'Failed to remove question');
    }
  };

  const handlePublishToggle = async () => {
    try {
      await togglePublishMockTest(id);
      loadTest();
    } catch {
      showToast('error', 'Toggle failed');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!test) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500">Test not found.</div>
      </AdminLayout>
    );
  }

  const cfg = test.configuration_json ?? {};
  const isDynamic = test.test_type === 'dynamic';
  const questions = test.questions ?? [];

  const diffData = cfg.difficulty
    ? [
        { label: 'Easy', v: cfg.difficulty.easy ?? 0, color: '#22c55e' },
        { label: 'Medium', v: cfg.difficulty.medium ?? 0, color: '#f59e0b' },
        { label: 'Hard', v: cfg.difficulty.hard ?? 0, color: '#ef4444' },
      ]
    : [];

  return (
    <AdminLayout>
      <Toast toast={toast} />
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => { handleRemove(removeTarget); setRemoveTarget(null); }}
        title="Remove Question?"
        message="Remove this question from the test?"
        confirmLabel="Remove"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <Link to="/admin/mock-tests" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Mock Tests
        </Link>

        {/* Test Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{test.title}</h1>
                <TypeBadge type={test.test_type} />
                {test.is_published
                  ? <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Published</span>
                  : <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">Draft</span>}
              </div>
              {test.description && <p className="text-sm text-slate-500 mt-2">{test.description}</p>}
            </div>
            <button
              onClick={handlePublishToggle}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                test.is_published
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {test.is_published ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              {test.is_published ? 'Unpublish' : 'Publish'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'Duration', value: test.duration_minutes ? `${test.duration_minutes} min` : '—' },
              { label: 'Total Marks', value: test.total_marks ?? '—' },
              { label: 'Questions', value: isDynamic ? '(dynamic)' : questions.length },
              { label: 'Type', value: test.test_type },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</div>
                <div className="text-base font-semibold text-slate-800 mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic config */}
        {isDynamic && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-800">Dynamic Configuration</h2>

            {cfg.subjects?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Subject Distribution</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Subject ID</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Question Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfg.subjects.map((s, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-700">{s.subject_id}</td>
                          <td className="px-4 py-2 text-right text-slate-700 font-medium">{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {diffData.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Difficulty Breakdown</h3>
                <MiniPie data={diffData} />
              </div>
            )}
          </div>
        )}

        {/* Fixed test — question management */}
        {!isDynamic && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Questions ({questions.length})</h2>
            </div>

            {/* Question picker */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Questions</h3>
              <QuestionPicker
                testId={id}
                addedQuestions={questions}
                onAdd={handleAdd}
                onRemove={(qId) => setRemoveTarget(qId)}
              />
            </div>

            {/* Added questions list */}
            {questions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Questions</h3>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {questions.map((q, idx) => (
                    <div key={q.id ?? q.question_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                        {q.question_order ?? idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 line-clamp-1">
                          {q.question?.question_text ?? q.question_text ?? `Question #${q.question_id}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setRemoveTarget(q.question_id ?? q.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
