import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getMockTestInfo, getAttempt, submitAnswer, submitAttempt } from '@/api/userService';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const fmtTime = (s) => {
  if (s == null || s <= 0) return '00:00:00';
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
};

export const MockExamSession = () => {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [test, setTest]             = useState(null);
  const [questions, setQuestions]   = useState([]); // sorted attempt_questions
  const [answers, setAnswers]       = useState({}); // { question_id: selected_option_id }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const autoSubmitted = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [attemptRes, testRes] = await Promise.all([
        getAttempt(attemptId),
        getMockTestInfo(testId),
      ]);
      const attempt  = attemptRes.data?.data ?? attemptRes.data;
      const testData = testRes.data?.data    ?? testRes.data;

      // If already completed, jump straight to results
      if (attempt.status === 'completed') {
        navigate(`/mock-exam/${testId}/result/${attemptId}`, { replace: true });
        return;
      }

      setTest(testData);

      const qs = (attempt.attempt_questions ?? [])
        .slice()
        .sort((a, b) => a.question_order - b.question_order);
      setQuestions(qs);

      // Hydrate answers from any previous saves
      const map = {};
      (attempt.answers ?? []).forEach(a => { map[a.question_id] = a.selected_option_id; });
      setAnswers(map);

      // Calculate remaining seconds
      const endMs     = new Date(attempt.started_at).getTime() + testData.duration_minutes * 60_000;
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setTimeLeft(remaining);
    } catch { /* TODO: show error state */ }
    finally { setLoading(false); }
  }, [attemptId, testId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (!autoSubmitted.current) {
        autoSubmitted.current = true;
        doSubmit();
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    // Fire-and-forget save
    submitAnswer(attemptId, { question_id: questionId, selected_option_id: optionId }).catch(() => {});
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await submitAttempt(attemptId);
      navigate(`/mock-exam/${testId}/result/${attemptId}`);
    } catch {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout active="mock-exam">
        <div className="flex items-center justify-center h-full py-24">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const aq              = questions[currentIdx];
  const currentQ        = aq?.question;
  const answeredCount   = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const timerUrgent     = timeLeft !== null && timeLeft < 300; // < 5 min

  const opts = currentQ?.options ?? [];

  return (
    <DashboardLayout active="mock-exam">
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      {/* ── Confirm submit dialog ─────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Submit Test?</h3>
                {unansweredCount > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Once submitted you cannot change your answers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={doSubmit}
                disabled={submitting}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* ── Exam top bar ───────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 gap-3">
          <h2 className="font-semibold text-slate-900 text-sm truncate flex-1">{test?.title}</h2>
          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-lg shrink-0 ${
            timerUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            {fmtTime(timeLeft)}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="shrink-0 px-4 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Submit Test
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Question grid sidebar ──────────────────────────────────────── */}
          <aside className="hidden md:flex flex-col w-48 border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Questions</p>
            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {questions.map((item, i) => {
                const isAnswered = !!answers[item.question_id];
                const isCurrent  = i === currentIdx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-7 h-7 text-[11px] font-semibold rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-violet-600 text-white ring-2 ring-violet-300 ring-offset-1'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-100 shrink-0" />
                Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 shrink-0" />
                Remaining ({unansweredCount})
              </div>
            </div>
          </aside>

          {/* ── Question area ──────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {!aq ? (
              <p className="text-slate-400 text-center py-12">No questions loaded.</p>
            ) : (
              <div className="max-w-2xl mx-auto">
                {/* Question header */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-slate-500 font-medium">
                    Question {currentIdx + 1} <span className="text-slate-300">/ {questions.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {currentQ?.subject?.name && (
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                        {currentQ.subject.name}
                      </span>
                    )}
                    {/* Mobile answered count */}
                    <span className="md:hidden text-xs text-slate-400">{answeredCount}/{questions.length}</span>
                  </div>
                </div>

                {/* Question text */}
                <h2 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
                  {currentQ?.question_text}
                </h2>

                {/* Question image */}
                {currentQ?.question_image && (
                  <div className="mb-6 flex justify-center">
                    <ProtectedImage
                      src={currentQ.question_image}
                      alt="Question"
                      className="max-w-full rounded-xl border border-slate-200"
                      onClick={setLightboxSrc}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {opts.map(opt => {
                    const isSelected = answers[aq.question_id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(aq.question_id, opt.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {opt.option_key}
                        </span>
                        <span className="text-slate-800 font-medium flex-1">{opt.option_text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="hidden md:block text-xs text-slate-400">{answeredCount} of {questions.length} answered</span>
                  <button
                    onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                    disabled={currentIdx === questions.length - 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};
