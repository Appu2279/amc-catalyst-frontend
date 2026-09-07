import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getQuestions, getSubjectsPublic, checkAnswer, getPracticeProgress, resetPracticeProgress, getQuestionBatches } from '@/api/userService';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { Check, X, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, Lightbulb, Layers, ArrowRight, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { LockedSection, LOCKED_COPY } from '@/components/LockedSection';
import { SampleBanner } from '@/components/SampleBanner';

const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

const diffLabel = (d) => d === '' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1);
const diffColor = (d, active) => {
  if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-400';
  const map = { '': 'bg-slate-800 text-white border-slate-800', easy: 'bg-green-600 text-white border-green-600', medium: 'bg-amber-500 text-white border-amber-500', hard: 'bg-red-600 text-white border-red-600' };
  return map[d] ?? 'bg-brand-blue text-white border-brand-blue';
};

// Splits on bullet-like separators. Pure \uXXXX escapes — no literal glyphs.
// •=• ‣=‣ ⁃=⁃ ·=· ▪=▪ ●=● ■=■ ▸=▸
// ∙=∙ ≡=≡ ☰=☰ =PDF-private-use-bullet
const BULLET_RE = /[•‣⁃·▪▫●○■□▸►∙≡☰☱☲]+/g;

const ExplanationText = ({ text, className = '' }) => {
  if (!text) return null;

  // Log every unique non-alphanumeric, non-space character with its code point
  const suspicious = [...new Set(text.split('').filter(c => /[^\w\s]/.test(c)))];
  if (suspicious.length) {
    console.log('[ExplanationText] non-word chars →',
      suspicious.map(c => `"${c}" U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')}`).join('  ')
    );
  }

  const parts = text.split(BULLET_RE).map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return <p className={`text-sm leading-relaxed ${className}`}>{text.trim()}</p>;
  }
  return (
    <ul className={`text-sm leading-relaxed space-y-1.5 ${className}`}>
      {parts.map((part, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
          <span>{part}</span>
        </li>
      ))}
    </ul>
  );
};

export const Recall = () => {
  const { sections, samples, loading: accessLoading } = useAccess();
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [subjects, setSubjects]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const [checking, setChecking]       = useState(false); // API call in-flight
  const [checked, setChecked]         = useState(false);
  const [checkResult, setCheckResult] = useState(null);  // response from /check endpoint
  // question_id -> is_correct, seeded from the server so it survives a logout.
  // Score is derived from this rather than counted up as the student answers:
  // a counter would double-count a question answered twice in one sitting, and
  // would reset to zero on every visit.
  const [answered, setAnswered]       = useState({});
  const [resuming, setResuming]       = useState(false);
  // Two-step confirm: clearing progress is not undoable, and a stray click on a
  // single button would wipe a student's place in a 146-question set.
  // Recall is grouped by the month it was uploaded ("August Recall 2026").
  // batchId null means the batches have not loaded yet; questions wait for it so
  // the student never briefly sees every month mixed together.
  const [batches, setBatches]         = useState([]);
  const [batchId, setBatchId]         = useState(null);
  const [batchesLoaded, setBatchesLoaded] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting]     = useState(false);
  const [filters, setFilters]         = useState({ subject_id: '', difficulty: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    getSubjectsPublic()
      .then(res => setSubjects(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, []);

  // A batch the admin has hidden never reaches this list, so there is nothing
  // to filter here.
  const loadBatches = useCallback(() => {
    return getQuestionBatches({ source_type: 'recall' })
      .then(res => {
        setBatches(res.data?.data ?? []);
        // The picker is always shown, even for a single set — Notes and Mock
        // Exams both list one item rather than skipping their chooser, and
        // recall sets accumulate month by month, so the screen a student learns
        // today is the one they keep using.
      })
      .catch(() => setBatches([]))
      .finally(() => setBatchesLoaded(true));
  }, []);

  // Re-fetched every time the student lands on the picker, not just on mount:
  // the cards show how far through each set they are, and coming back from
  // answering questions must not show the counts from before they started.
  useEffect(() => {
    if (batchId === null) loadBatches();
  }, [batchId, loadBatches]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setCurrentIdx(0);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
    try {
      const params = { source_type: 'recall', limit: 500, is_active: true };
      if (batchId) params.import_batch_id = batchId;
      if (filters.subject_id) params.subject_id = filters.subject_id;
      if (filters.difficulty) params.difficulty = filters.difficulty;

      // Fetched together so the first question shown is already the resume
      // point — loading them in sequence would render question 1 first and then
      // visibly jump.
      const [questionRes, progressRes] = await Promise.all([
        getQuestions(params),
        // Progress must not be able to break practice: if it fails the student
        // simply starts from the beginning.
        // Scoped to the same batch, so "answered 10 of 40" counts this month
        // rather than every recall the student has ever done.
        getPracticeProgress({ source_type: 'recall', ...(batchId ? { import_batch_id: batchId } : {}) })
          .catch(() => null),
      ]);

      const list = questionRes.data?.data ?? [];
      setQuestions(list);
      setTotal(questionRes.data?.pagination?.total ?? 0);

      const progress = progressRes?.data?.data;
      const answeredMap = Object.fromEntries(
        (progress?.answers ?? []).map((a) => [a.question_id, Boolean(a.is_correct)])
      );
      setAnswered(answeredMap);

      // Resume at the first question this student has not answered. Derived
      // from the list actually on screen, so it stays right when questions are
      // added or a filter narrows the set.
      //
      // Tests for the KEY, not the value: the map holds is_correct, so
      // `!answeredMap[id]` would treat every wrongly-answered question as
      // unanswered and resume there instead of moving past it.
      const firstUnanswered = list.findIndex((q) => !(q.id in answeredMap));
      // Everything answered: leave them at the start rather than stranded on a
      // question they have already done.
      const resumeAt = firstUnanswered === -1 ? 0 : firstUnanswered;
      setCurrentIdx(resumeAt);
      setResuming(resumeAt > 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters, batchId]);

  useEffect(() => {
    // Nothing is fetched until a batch is chosen: the student is on the picker,
    // and loading every month behind it would be wasted work.
    if (batchesLoaded && batchId !== null) loadQuestions();
  }, [loadQuestions, batchesLoaded, batchId]);

  const q = questions[currentIdx];

  // Restricted to the questions currently listed, so the tally matches the
  // "of N" the student is looking at when a filter is applied.
  const score = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    for (const item of questions) {
      if (!(item.id in answered)) continue;
      answered[item.id] ? correct++ : wrong++;
    }
    return { correct, wrong };
  }, [questions, answered]);

  // These come from the /check response — never sent with the question list
  const isCorrect = checkResult?.is_correct;
  const correctOpt = checkResult?.options?.find(o => o.is_correct);

  // Build a fast lookup: option id → revealed data (is_correct, explanation, option_image)
  const revealMap = checkResult
    ? Object.fromEntries(checkResult.options.map(o => [o.id, o]))
    : {};

  // Click → POST /questions/:id/check → reveal
  const handleSelect = async (optId) => {
    if (checked || checking) return;
    setSelectedId(optId);
    setChecking(true);
    try {
      const res = await checkAnswer(q.id, { selected_option_id: optId });
      const result = res.data?.data ?? res.data;
      setCheckResult(result);
      setChecked(true);
      // The server records this too — this keeps the on-screen tally in step
      // without re-fetching progress after every answer.
      setAnswered(prev => ({ ...prev, [q.id]: Boolean(result.is_correct) }));
    } catch {
      setSelectedId(null); // undo selection so student can retry
    } finally {
      setChecking(false);
    }
  };

  const handleStartOver = async () => {
    setResetting(true);
    try {
      await resetPracticeProgress({ source_type: 'recall', ...(batchId ? { import_batch_id: batchId } : {}) });
      // Reset locally rather than re-fetching: the server is now empty for this
      // mode, so a round trip would only tell us what we already know.
      setAnswered({});
      setCurrentIdx(0);
      setSelectedId(null);
      setChecked(false);
      setCheckResult(null);
      setResuming(false);
      setConfirmReset(false);
    } catch {
      // Left on screen with the confirm still open so the student can retry.
    } finally {
      setResetting(false);
    }
  };

  const go = (dir) => {
    const next = currentIdx + dir;
    if (next < 0 || next >= questions.length) return;
    setResuming(false);
    setCurrentIdx(next);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
  };

  const images = q
    ? (q.question_images?.length ? q.question_images : q.question_image ? [q.question_image] : [])
    : [];

  // ── Filter panel ────────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</p>
        <select
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          value={filters.subject_id}
          onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</p>
        <div className="flex flex-col gap-1.5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setFilters(f => ({ ...f, difficulty: d }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-left ${diffColor(d, filters.difficulty === d)}`}
            >
              {diffLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {(score.correct + score.wrong) > 0 && (
        <div>
          {/* Not "Session Score" any more — it is kept on the server and
              survives logging out, so it is the student's running total. */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Score</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <Check className="w-4 h-4" /> {score.correct}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
              <X className="w-4 h-4" /> {score.wrong}
            </span>
            <span className="ml-auto text-[11px] text-slate-400 tabular-nums">
              {score.correct + score.wrong}/{questions.length}
            </span>
          </div>

          {confirmReset ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Clear your answers and start from question 1? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleStartOver}
                  disabled={resetting}
                  className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Clearing…' : 'Yes, start over'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  disabled={resetting}
                  className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start over
            </button>
          )}
        </div>
      )}
    </div>
  );

  // The server already refuses these requests; this turns the refusal into
  // something a student can act on instead of an empty page. Placed above the
  // batch picker so an unpaid student never sees a month list they cannot open,
  // and after every hook, so the early return does not change hook order.
  if (accessLoading) {
    return (
      <DashboardLayout active="recall">
        <div className="p-16 text-center text-sm text-slate-400">Loading…</div>
      </DashboardLayout>
    );
  }

  const showingSamples = !sections.recall && samples.recall > 0;

  // ── Batch picker ────────────────────────────────────────────────────────────
  // Shown until a recall month is chosen, matching how Mock Exams and Notes ask
  // the student to pick something before the content opens.
  if (batchesLoaded && batchId === null) {
    return (
      <DashboardLayout active="recall">
        {showingSamples && <SampleBanner count={samples.recall} noun="questions" />}
        <div className="min-h-full bg-slate-50 py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Recall Practice</h1>
              <p className="text-slate-500 text-sm mt-1">
                Questions recalled by past candidates, grouped by exam sitting.
              </p>
            </div>

            {!accessLoading && !sections.recall && batches.some((b) => !b.is_free) && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-violet text-white">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-slate-900">
                      Complete recall question sets for every sitting.
                    </span>{' '}
                    <span className="text-slate-500">
                      Free samples below are open to everyone — full access comes with any plan.
                    </span>
                  </p>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-violet px-4 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-brand-violet-hover transition"
                >
                  Unlock all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {batches.length === 0 ? (
              <div className="text-center py-24">
                <Layers className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No recall sets are available yet.</p>
                <p className="text-slate-300 text-sm mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {batches.map(b => {
                  const done = b.answered_count ?? 0;
                  const pct = b.question_count ? Math.round((done / b.question_count) * 100) : 0;
                  const complete = done > 0 && done >= b.question_count;
                  const isFree = Boolean(b.is_free);
                  const hasAccess = Boolean(sections.recall || isFree);

                  return (
                    <div
                      key={b.id ?? 'other'}
                      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="text-base font-semibold text-slate-900 leading-snug">{b.title}</h2>
                        {complete ? (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : isFree ? (
                          <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Free sample
                          </span>
                        ) : !hasAccess ? (
                          <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" /> Unlock
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4" /> {b.question_count} questions
                        </span>
                        {done > 0 && (
                          <span className="tabular-nums">{done} answered</span>
                        )}
                      </div>

                      {done > 0 && (
                        <div className="mb-5">
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-brand-blue h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {hasAccess ? (
                        <button
                          onClick={() => setBatchId(b.id)}
                          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
                        >
                          {done > 0 && !complete ? 'Continue' : done > 0 ? 'Practise again' : 'Start practising'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <Link
                          to="/pricing"
                          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100"
                        >
                          <Lock className="h-4 w-4" />
                          Unlock with a plan
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="recall">
      {showingSamples && <SampleBanner count={samples.recall} noun="questions" />}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <div className="flex h-full overflow-hidden">

        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        {/* <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h1 className="text-base font-bold text-slate-900">Recall Practice</h1>
            <p className="text-xs text-slate-400 mt-0.5">{total} questions</p>
          </div>
          <div className="p-4 flex-1">
            <FilterPanel />
          </div>
        </aside> */}

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
            <div>
              <h1 className="text-sm font-bold text-slate-900">Recall Practice</h1>
              <p className="text-xs text-slate-400">{total} questions</p>
            </div>
            <div className="flex items-center gap-2">
              {(score.correct + score.wrong) > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  <span className="text-green-600">{score.correct}</span>
                  {' / '}
                  <span className="text-red-500">{score.wrong}</span>
                </span>
              )}
              {/* <button
                onClick={() => setShowFilters(v => !v)}
                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-brand-blue text-white border-brand-blue' : 'border-slate-200 text-slate-600'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button> */}
            </div>
          </div>

          {/* Mobile filter drawer */}
          {/* {showFilters && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4">
              <FilterPanel />
            </div>
          )} */}

          {/* Which set is open, and the way back to the picker. */}
          {batches.length > 0 && (
            <div className="bg-white border-b border-slate-200 px-3 md:px-5 py-2.5 flex items-center gap-3">
              <button
                onClick={() => {
                  setBatchId(null);
                  // Cleared so the picker cannot briefly show the previous set's
                  // questions behind it on the way out.
                  setQuestions([]);
                  setCurrentIdx(0);
                  setSelectedId(null);
                  setChecked(false);
                  setCheckResult(null);
                  setResuming(false);
                  setConfirmReset(false);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                All recall sets
              </button>
              <span className="w-px h-4 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {batches.find(b => b.id === batchId)?.title ?? 'Recall'}
              </span>
            </div>
          )}

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <div className="w-7 h-7 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <p className="text-slate-400 text-sm">No questions found for the selected filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Resumed-from-last-time notice. Shown only until the student
                    moves, so it explains why practice did not open on question 1
                    without becoming permanent furniture. */}
                {resuming && (
                  <div className="px-5 py-2.5 bg-brand-blue/5 border-b border-brand-blue/10 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <p className="text-xs text-slate-600">
                      Resumed where you left off — you have answered{' '}
                      <strong className="text-slate-700">{score.correct + score.wrong}</strong> of{' '}
                      {questions.length}.
                    </p>
                  </div>
                )}

                {/* Progress + counter */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      Question <strong className="text-slate-700">{currentIdx + 1}</strong> of {questions.length}
                    </span>

                    {/* Start over lives here rather than in FilterPanel: that
                        panel and both of its call sites are commented out, so
                        anything placed in it never reaches the screen. */}
                    {(score.correct + score.wrong) > 0 && (
                      confirmReset ? (
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">Clear your answers?</span>
                          <button
                            onClick={handleStartOver}
                            disabled={resetting}
                            className="px-2 py-1 text-[11px] font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {resetting ? 'Clearing…' : 'Yes, start over'}
                          </button>
                          <button
                            onClick={() => setConfirmReset(false)}
                            disabled={resetting}
                            className="px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmReset(true)}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          title="Clear your answers and start from question 1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Start over
                        </button>
                      )
                    )}
                    {/* {q.subject && (
                      <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {q.subject.name}{q.topic ? ` · ${q.topic.name}` : ''}
                      </span>
                    )} */}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1">
                    <div
                      className="bg-brand-blue h-1 rounded-full transition-all duration-500"
                      style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="px-5 py-4">

                  {/* Question text */}
                  <p className="text-[17px] font-semibold text-slate-900 leading-relaxed mb-4">
                    {q.question_text}
                  </p>

                  {/* Question images */}
                  {images.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 items-center">
                      {images.map((src, i) => (
                        <ProtectedImage
                          key={i}
                          src={src}
                          alt={`Question image ${i + 1}`}
                          className="max-w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50"
                          onClick={setLightboxSrc}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hint before selection */}
                  {!checked && !checking && (
                    <p className="text-xs text-slate-400 mb-3 italic">
                      Select an option — explanations will be revealed instantly
                    </p>
                  )}

                  {/* Result banner */}
                  {checked && (
                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-3 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <p className={`text-base font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct!' : `Incorrect — correct answer is ${correctOpt?.option_key}`}
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {[...(q.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map(opt => {
                      const isThisSelected = opt.id === selectedId;
                      // is_correct only known after the API responds
                      const isThisCorrect  = checked ? (revealMap[opt.id]?.is_correct ?? false) : false;

                      let cardCls, dotCls;
                      if (!checked) {
                        if (checking && isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-wait';
                          dotCls  = 'bg-brand-blue text-white';
                        } else if (isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-pointer';
                          dotCls  = 'bg-brand-blue text-white';
                        } else {
                          cardCls = checking
                            ? 'border-slate-200 bg-white cursor-not-allowed opacity-60'
                            : 'border-slate-200 bg-white hover:border-brand-blue hover:bg-blue-50/50 cursor-pointer';
                          dotCls  = 'bg-slate-100 text-slate-600';
                        }
                      } else {
                        if (isThisCorrect) {
                          cardCls = 'border-green-400 bg-green-50 cursor-default';
                          dotCls  = 'bg-green-500 text-white';
                        } else if (isThisSelected) {
                          cardCls = 'border-red-400 bg-red-50 cursor-default';
                          dotCls  = 'bg-red-500 text-white';
                        } else {
                          cardCls = 'border-slate-200 bg-slate-50 cursor-default';
                          dotCls  = 'bg-slate-200 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect(opt.id)}
                          disabled={checking || checked}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${cardCls}`}
                        >
                          {/* Key badge — shows spinner while this option is being checked */}
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${dotCls}`}>
                            {checking && isThisSelected
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : opt.option_key
                            }
                          </span>
                          <span className={`text-[15px] font-medium flex-1 leading-snug ${checked && !isThisCorrect && !isThisSelected ? 'text-slate-500' : 'text-slate-800'}`}>
                            {opt.option_text}
                          </span>
                          {checked && isThisCorrect                    && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                          {checked && isThisSelected && !isThisCorrect && <X     className="w-4 h-4 text-red-500  shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Explanations panel — all options listed together ──────── */}
                  {checked && checkResult && (checkResult.options ?? []).some(o => o.explanation) && (
                    <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explanations</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[...(checkResult.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map(opt => {
                          const isThisCorrect  = opt.is_correct;
                          const isThisSelected = opt.id === selectedId;
                          let badgeCls = 'bg-slate-200 text-slate-500';
                          if (isThisCorrect)       badgeCls = 'bg-green-500 text-white';
                          else if (isThisSelected) badgeCls = 'bg-red-500 text-white';
                          return (
                            <div key={opt.id} className="flex gap-3 px-4 py-3.5">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${badgeCls}`}>
                                {opt.option_key}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold mb-1 ${
                                  isThisCorrect ? 'text-green-700' : isThisSelected ? 'text-red-700' : 'text-slate-700'
                                }`}>
                                  {opt.option_text}
                                </p>
                                {opt.option_image && (
                                  <ProtectedImage
                                    src={opt.option_image}
                                    alt={`Option ${opt.option_key} image`}
                                    className="mb-2 max-w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                    onClick={setLightboxSrc}
                                  />
                                )}
                                {opt.explanation
                                  ? <ExplanationText text={opt.explanation} className={isThisCorrect ? 'text-slate-700' : 'text-slate-600'} />
                                  : <span className="text-sm text-slate-300 italic">No explanation provided.</span>
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Question-level note: answer images + key take-home points */}
                  {checked && (checkResult?.answer_images?.length > 0 || checkResult?.explanation) && (
                    <div className="flex gap-2.5 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                      <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        {(checkResult.answer_images ?? []).map((src, i) => (
                          <div key={i} className="flex justify-center">
                            <ProtectedImage
                              src={src}
                              alt={`Answer image ${i + 1}`}
                              className="max-w-full max-h-64 object-contain rounded-lg border border-amber-200 bg-white"
                              onClick={setLightboxSrc}
                            />
                          </div>
                        ))}
                        {checkResult.explanation && (
                          <ExplanationText text={checkResult.explanation} className="text-amber-900 font-semibold" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => go(-1)}
                      disabled={currentIdx === 0}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <button
                      onClick={() => go(1)}
                      disabled={!checked || currentIdx === questions.length - 1}
                      className="px-5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                    >
                      Next Question
                    </button>

                    <button
                      onClick={() => go(1)}
                      disabled={currentIdx === questions.length - 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Skip <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
