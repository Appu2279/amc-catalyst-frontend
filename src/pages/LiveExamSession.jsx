import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { useCurrentLiveExam } from '@/hooks/useCurrentLiveExam';
import { getLiveExamAttempt, saveLiveExamAnswer, submitLiveExam } from '@/api/liveExamService';
import { fmtClock, errorMessage } from '@/components/liveExam/format';

const questionImages = (q) =>
  q?.question_images?.length ? q.question_images : q?.question_image ? [q.question_image] : [];

/**
 * The live exam is taken strictly in order: each question is answered (or
 * skipped) once and locked, with no going back. The server enforces the same
 * rule, so this screen only ever shows the one question that can be answered.
 */
export const LiveExamSession = () => {
  const navigate = useNavigate();
  const { refresh: refreshCurrent } = useCurrentLiveExam();

  const [examId, setExamId] = useState(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // question_id → option_id, locked answers only
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null); // not yet submitted
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [endAt, setEndAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const finished = useRef(false);

  const leave = useCallback(async () => {
    finished.current = true;
    await refreshCurrent();
    navigate('/live-exam', { replace: true });
  }, [navigate, refreshCurrent]);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const exam = await refreshCurrent();
        if (!exam || exam.my_attempt?.status !== 'in_progress') { navigate('/live-exam', { replace: true }); return; }
        const { data } = await getLiveExamAttempt(exam.id);
        if (data.attempt.status !== 'in_progress') { navigate('/live-exam', { replace: true }); return; }
        setExamId(exam.id);
        setTitle(data.exam.title);
        setQuestions(data.questions);
        setAnswers(Object.fromEntries(Object.entries(data.answers).map(([q, o]) => [Number(q), o])));
        // Resumes where the student left off after a reload.
        setCurrentIdx(data.current_index ?? 0);
        // From the server's own count, so a wrong clock on this device does not matter.
        setEndAt(Date.now() + data.attempt.seconds_remaining * 1000);
      } catch (err) {
        setLoadError(errorMessage(err, 'Could not load your exam. Check your connection and reload the page.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Closing the tab does not stop the clock — make sure it is deliberate.
  useEffect(() => {
    const warn = (e) => {
      if (finished.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const q = questions[currentIdx];
  const isAllDone = questions.length > 0 && currentIdx >= questions.length;

  // ── Locking in an answer ────────────────────────────────────────────────────
  const lockInAndContinue = async (optionId) => {
    if (!q || isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await saveLiveExamAnswer(examId, { question_id: q.question_id, selected_option_id: optionId });
      if (optionId != null) setAnswers((a) => ({ ...a, [q.question_id]: optionId }));
      setSelectedOptionId(null);
      setCurrentIdx((i) => i + 1);
    } catch (err) {
      if (err.response?.status === 409) { leave(); return; } // time is up / already submitted
      setSaveError(errorMessage(err, 'Could not save your answer. Check your connection and try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Submitting the exam ─────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (finished.current) return;
    setSubmitting(true);
    setSubmitError('');
    // A pick on the current question that wasn't submitted yet still counts —
    // it is the next question in order, so the server accepts it.
    if (q && selectedOptionId != null) {
      await saveLiveExamAnswer(examId, { question_id: q.question_id, selected_option_id: selectedOptionId })
        .catch(() => {});
    }
    try {
      await submitLiveExam(examId);
      await leave();
    } catch (err) {
      if (err.response?.status === 409) { await leave(); return; }
      setSubmitError(errorMessage(err, 'Could not submit. Check your connection and try again.'));
      setSubmitting(false);
    }
  }, [examId, leave, q, selectedOptionId]);

  const secondsLeft = endAt == null ? null : Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    if (secondsLeft === 0 && !finished.current && !submitting) doSubmit();
  }, [secondsLeft, submitting, doSubmit]);

  // Letter keys pick an option on the current question.
  useEffect(() => {
    const onKey = (e) => {
      if (showConfirm || lightboxSrc || isSaving || !q || e.target.closest?.('input, textarea')) return;
      if (/^[a-h]$/i.test(e.key)) {
        const opt = q.options.find((o) => String(o.option_key).toLowerCase() === e.key.toLowerCase());
        if (opt) setSelectedOptionId(opt.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bound each render so it always sees the current question

  const answeredCount = Object.keys(answers).length;
  const skippedCount = Math.min(currentIdx, questions.length) - answeredCount;
  const remainingCount = Math.max(0, questions.length - currentIdx);
  const timerUrgent = secondsLeft != null && secondsLeft < 300;
  const progressPercent = questions.length ? (Math.min(currentIdx, questions.length) / questions.length) * 100 : 0;

  if (loading || loadError) {
    return (
      <DashboardLayout active="live-exam" collapseNav>
        <div className="flex items-center justify-center py-24 px-4">
          {loadError
            ? <p className="text-sm text-red-600 text-center max-w-sm">{loadError}</p>
            : <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="live-exam" collapseNav>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Finish your exam?</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 mb-4">
              <li>Answered: <strong>{answeredCount}</strong> of {questions.length}</li>
              {skippedCount > 0 && <li>Skipped: <strong>{skippedCount}</strong></li>}
              {remainingCount > 0 && <li className="text-amber-700">Not yet reached: <strong>{remainingCount}</strong> — these will be marked unanswered.</li>}
            </ul>
            <p className="text-sm text-slate-500 mb-5">You cannot sit the exam again after finishing.</p>
            {submitError && <p className="text-sm text-red-600 mb-3">{submitError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={submitting} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                Keep going
              </button>
              <button onClick={doSubmit} disabled={submitting} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Finish exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ height: 'calc(100dvh - 4rem)' }}>
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 gap-3">
          <h2 className="font-semibold text-slate-900 text-sm truncate flex-1">{title}</h2>
          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-lg shrink-0 ${
            timerUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-4 h-4" /> {fmtClock(secondsLeft)}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="shrink-0 px-4 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
          >
            Finish
          </button>
        </div>

        <div className="h-1 bg-slate-100 shrink-0">
          <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {isAllDone ? (
            <div className="max-w-md mx-auto text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">You've reached the end</h2>
              <p className="text-sm text-slate-500 mt-2">
                {answeredCount} of {questions.length} answered{skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.
                Finish the exam to hand it in.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold"
              >
                Finish exam
              </button>
            </div>
          ) : q && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-5 gap-2">
                <span className="text-sm text-slate-500 font-medium">
                  Question {currentIdx + 1} <span className="text-slate-300">/ {questions.length}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5" /> Answers are final once submitted
                </span>
              </div>

              <h2 className="text-[18px] font-semibold text-slate-900 mb-6 leading-relaxed whitespace-pre-line">{q.question_text}</h2>

              {questionImages(q).map((src) => (
                <div key={src} className="mb-6 flex justify-center">
                  <ProtectedImage src={src} alt="Question" className="max-w-full rounded-xl border border-slate-200" onClick={setLightboxSrc} />
                </div>
              ))}

              <div className="space-y-3 mb-6">
                {q.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      disabled={isSaving}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                        isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opt.option_key}
                      </span>
                      <span className="flex-1">
                        <span className="text-[15px] text-slate-800 font-medium leading-snug">{opt.option_text}</span>
                        {opt.option_image && (
                          <ProtectedImage src={opt.option_image} alt={`Option ${opt.option_key}`} className="mt-2 max-h-40 rounded-lg border border-slate-200" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {saveError && (
                <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {saveError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => lockInAndContinue(null)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  Skip question
                </button>
                <button
                  onClick={() => lockInAndContinue(selectedOptionId)}
                  disabled={isSaving || selectedOptionId == null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {currentIdx === questions.length - 1 ? 'Submit answer' : 'Submit & next'}
                  {!isSaving && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-3 text-right text-xs text-slate-400">
                You cannot go back to a question once you submit or skip it.
              </p>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};
