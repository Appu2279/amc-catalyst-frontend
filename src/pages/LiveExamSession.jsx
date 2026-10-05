import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle, Flag, Grid3x3, X, WifiOff, Eraser,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { useCurrentLiveExam } from '@/hooks/useCurrentLiveExam';
import { getLiveExamAttempt, saveLiveExamAnswer, submitLiveExam } from '@/api/liveExamService';
import { fmtClock, errorMessage } from '@/components/liveExam/format';

const RETRY_DELAYS_MS = [1000, 3000, 8000, 15000];

const questionImages = (q) =>
  q?.question_images?.length ? q.question_images : q?.question_image ? [q.question_image] : [];

// Flags are a private reminder ("come back to this"), so they live in the
// browser only — the server never needs them.
const flagsKey = (attemptId) => `amc_live_exam_flags_${attemptId}`;
const loadFlags = (attemptId) => {
  try { return new Set(JSON.parse(localStorage.getItem(flagsKey(attemptId)) ?? '[]')); } catch { return new Set(); }
};
const storeFlags = (attemptId, flags) => {
  try { localStorage.setItem(flagsKey(attemptId), JSON.stringify([...flags])); } catch { /* storage unavailable */ }
};

export const LiveExamSession = () => {
  const navigate = useNavigate();
  const { refresh: refreshCurrent } = useCurrentLiveExam();

  const [examId, setExamId] = useState(null);
  const [title, setTitle] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // question_id → option_id
  const [unsaved, setUnsaved] = useState({}); // question_id → 'saving' | 'failed'
  const [flags, setFlags] = useState(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [endAt, setEndAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Latest value per question waiting to be (re)sent, so a retry never
  // overwrites a newer pick with an older one.
  const pending = useRef(new Map());
  const retryTimers = useRef(new Map());
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
        setAttemptId(data.attempt.id);
        setQuestions(data.questions);
        setAnswers(Object.fromEntries(Object.entries(data.answers).map(([q, o]) => [Number(q), o])));
        setFlags(loadFlags(data.attempt.id));
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

  useEffect(() => () => retryTimers.current.forEach(clearTimeout), []);

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

  // ── Saving answers ──────────────────────────────────────────────────────────
  const send = useCallback(async (questionId, attempt = 0) => {
    if (!pending.current.has(questionId) || finished.current) return;
    const optionId = pending.current.get(questionId);
    setUnsaved((u) => ({ ...u, [questionId]: 'saving' }));
    try {
      await saveLiveExamAnswer(examId, { question_id: questionId, selected_option_id: optionId });
      // Only clear if nothing newer was picked while this was in flight.
      if (pending.current.get(questionId) === optionId) {
        pending.current.delete(questionId);
        setUnsaved(({ [questionId]: _, ...rest }) => rest);
      }
    } catch (err) {
      if (err.response?.status === 409) { leave(); return; } // time is up / already submitted
      setUnsaved((u) => ({ ...u, [questionId]: 'failed' }));
      const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      clearTimeout(retryTimers.current.get(questionId));
      retryTimers.current.set(questionId, setTimeout(() => send(questionId, attempt + 1), delay));
    }
  }, [examId, leave]);

  const choose = (questionId, optionId) => {
    setAnswers((a) => {
      const next = { ...a };
      if (optionId == null) delete next[questionId]; else next[questionId] = optionId;
      return next;
    });
    pending.current.set(questionId, optionId);
    clearTimeout(retryTimers.current.get(questionId));
    send(questionId);
  };

  const retryAll = () => { for (const qid of pending.current.keys()) send(qid); };

  // ── Submitting ──────────────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (finished.current) return;
    setSubmitting(true);
    setSubmitError('');
    // One last push of anything unsaved; the server accepts answers for a few
    // seconds past the deadline for exactly this.
    await Promise.allSettled([...pending.current.entries()].map(([question_id, selected_option_id]) =>
      saveLiveExamAnswer(examId, { question_id, selected_option_id })));
    try {
      await submitLiveExam(examId);
      try { localStorage.removeItem(flagsKey(attemptId)); } catch { /* ignore */ }
      await leave();
    } catch (err) {
      if (err.response?.status === 409) { await leave(); return; }
      setSubmitError(errorMessage(err, 'Could not submit. Check your connection and try again.'));
      setSubmitting(false);
    }
  }, [examId, attemptId, leave]);

  const secondsLeft = endAt == null ? null : Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    if (secondsLeft === 0 && !finished.current && !submitting) doSubmit();
  }, [secondsLeft, submitting, doSubmit]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const toggleFlag = (questionId) => {
    setFlags((f) => {
      const next = new Set(f);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      storeFlags(attemptId, next);
      return next;
    });
  };

  const q = questions[currentIdx];

  useEffect(() => {
    const onKey = (e) => {
      if (showConfirm || lightboxSrc || e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowRight') setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setCurrentIdx((i) => Math.max(0, i - 1));
      else if (q && /^[a-h]$/i.test(e.key)) {
        const opt = q.options.find((o) => String(o.option_key).toLowerCase() === e.key.toLowerCase());
        if (opt) choose(q.question_id, opt.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bound each render so it always sees the current question

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const failedCount = Object.values(unsaved).filter((s) => s === 'failed').length;
  const flaggedCount = flags.size;
  const timerUrgent = secondsLeft != null && secondsLeft < 300;

  const palette = useMemo(() => questions.map((item, i) => {
    const answered = answers[item.question_id] != null;
    const flagged = flags.has(item.question_id);
    return { item, i, answered, flagged, failed: unsaved[item.question_id] === 'failed' };
  }), [questions, answers, flags, unsaved]);

  const renderPalette = (onPick) => (
    <>
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {palette.map(({ item, i, answered, flagged, failed }) => (
          <button
            key={item.question_id}
            onClick={() => onPick(i)}
            className={`relative w-8 h-8 text-[11px] font-semibold rounded-md transition-colors ${
              i === currentIdx
                ? 'bg-violet-600 text-white ring-2 ring-violet-300 ring-offset-1'
                : failed
                ? 'bg-red-100 text-red-700'
                : answered
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {i + 1}
            {flagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />}
          </button>
        ))}
      </div>
      <div className="space-y-1.5 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100" /> Answered ({answeredCount})</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100" /> Not answered ({unansweredCount})</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Flagged ({flaggedCount})</div>
      </div>
    </>
  );

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
              <h3 className="font-semibold text-slate-900">Submit your exam?</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 mb-4">
              <li>Answered: <strong>{answeredCount}</strong> of {questions.length}</li>
              {unansweredCount > 0 && <li className="text-amber-700">Not answered: <strong>{unansweredCount}</strong></li>}
              {flaggedCount > 0 && <li>Flagged for review: <strong>{flaggedCount}</strong></li>}
              {failedCount > 0 && <li className="text-red-600">Not yet saved: <strong>{failedCount}</strong> — we will try once more as you submit.</li>}
            </ul>
            <p className="text-sm text-slate-500 mb-5">You cannot change your answers or sit the exam again after submitting.</p>
            {submitError && <p className="text-sm text-red-600 mb-3">{submitError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={submitting} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                Keep going
              </button>
              <button onClick={doSubmit} disabled={submitting} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPalette && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setShowPalette(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Questions</p>
              <button onClick={() => setShowPalette(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            {renderPalette((i) => { setCurrentIdx(i); setShowPalette(false); })}
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

        {failedCount > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-700 shrink-0">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="flex-1">{failedCount} answer{failedCount === 1 ? '' : 's'} not saved yet — check your connection. We keep retrying.</span>
            <button onClick={retryAll} className="font-semibold underline">Retry now</button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex flex-col w-56 border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Questions</p>
            {renderPalette(setCurrentIdx)}
          </aside>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {q && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-5 gap-2">
                  <span className="text-sm text-slate-500 font-medium">
                    Question {currentIdx + 1} <span className="text-slate-300">/ {questions.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFlag(q.question_id)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        flags.has(q.question_id) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" /> {flags.has(q.question_id) ? 'Flagged' : 'Flag'}
                    </button>
                    <button onClick={() => setShowPalette(true)} className="md:hidden flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500">
                      <Grid3x3 className="w-3.5 h-3.5" /> {answeredCount}/{questions.length}
                    </button>
                  </div>
                </div>

                <h2 className="text-[18px] font-semibold text-slate-900 mb-6 leading-relaxed whitespace-pre-line">{q.question_text}</h2>

                {questionImages(q).map((src) => (
                  <div key={src} className="mb-6 flex justify-center">
                    <ProtectedImage src={src} alt="Question" className="max-w-full rounded-xl border border-slate-200" onClick={setLightboxSrc} />
                  </div>
                ))}

                <div className="space-y-3 mb-4">
                  {q.options.map((opt) => {
                    const selected = answers[q.question_id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => choose(q.question_id, opt.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                          selected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          selected ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-600'
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

                <div className="flex items-center justify-between h-6 mb-6 text-xs">
                  {answers[q.question_id] != null ? (
                    <button onClick={() => choose(q.question_id, null)} className="flex items-center gap-1 text-slate-400 hover:text-slate-700">
                      <Eraser className="w-3.5 h-3.5" /> Clear answer
                    </button>
                  ) : <span />}
                  <span className={unsaved[q.question_id] === 'failed' ? 'text-red-600' : 'text-slate-400'}>
                    {unsaved[q.question_id] === 'saving' ? 'Saving…'
                      : unsaved[q.question_id] === 'failed' ? 'Not saved — retrying'
                      : answers[q.question_id] != null ? 'Saved' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="hidden md:block text-xs text-slate-400">{answeredCount} of {questions.length} answered</span>
                  {currentIdx === questions.length - 1 ? (
                    <button onClick={() => setShowConfirm(true)} className="px-4 py-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
                      Review &amp; finish
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500 hover:text-slate-800"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};
