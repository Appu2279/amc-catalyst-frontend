import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import {
  getQuestions, getQuestionById, checkAnswer,
  getPracticeProgress, resetPracticeProgress, getQuestionSubjects, getQuestionTopics, getQuestionIds,
  addBookmark, removeBookmark,
} from '@/api/userService';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import {
  Check, X, ChevronLeft, ChevronRight, RefreshCw, Lightbulb, Layers,
  ArrowRight, CheckCircle2, Sparkles, Lock, Bookmark, RotateCcw,
} from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { SampleBanner } from '@/components/SampleBanner';

// Splits explanation text on bullet-like separators — same set Recall uses.
const BULLET_RE = /[•‣⁃·▪▫●○■□▸►∙≡☰☱☲]+/g;

const ExplanationText = ({ text, className = '' }) => {
  if (!text) return null;
  const parts = text.split(BULLET_RE).map((s) => s.trim()).filter(Boolean);
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

// Questions are fetched in pages rather than all at once: one subject can hold
// thousands of them.
const PAGE_SIZE = 50;

// Stand in for an id when the student practises the whole bank, or every
// topic of one subject.
const ALL_SUBJECTS = 'all';
const ALL_TOPICS = 'all';

// Must match PRACTICE_SCOPES on the backend. "All subjects" keeps its own
// progress, separate from the per-subject cards.
const PRACTICE_SCOPE_BY_MODE = { subject: 'default', allSubjects: 'all_subjects' };

const SubjectCard = ({ title, subtitle, total, available, answered, correct, hasPlan, onOpen, onRedoIncorrect }) => {
  const incorrect = answered - correct;
  const pct = available ? Math.round((answered / available) * 100) : 0;
  const isComplete = answered > 0 && answered >= available;
  const isLocked = available === 0;
  const isSamplesOnly = !hasPlan && available > 0 && available < total;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-base font-semibold text-slate-900 leading-snug">{title}</h2>
        {isComplete ? (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        ) : isSamplesOnly ? (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <Sparkles className="w-3 h-3 text-amber-600" /> {available} free
          </span>
        ) : isLocked ? (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" /> Unlock
          </span>
        ) : null}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}

      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
        <span className="flex items-center gap-1.5">
          <Layers className="w-4 h-4" /> {total} questions
        </span>
        {answered > 0 && (
          <span className="tabular-nums">
            {answered} answered · <span className="text-green-600">{correct} correct</span>
          </span>
        )}
      </div>

      {answered > 0 && (
        <div className="mb-4 w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-brand-blue h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {isLocked ? (
        <Link
          to="/pricing"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100"
        >
          <Lock className="h-4 w-4" />
          Unlock with a plan
        </Link>
      ) : (
        <button
          onClick={onOpen}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
        >
          {answered > 0 && !isComplete ? 'Continue' : answered > 0 ? 'Practise again' : 'Start practising'}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {!isLocked && onRedoIncorrect && incorrect > 0 && (
        <button
          onClick={onRedoIncorrect}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Redo {incorrect} incorrect
        </button>
      )}
    </div>
  );
};

export const QBank = () => {
  const { sections, samples, loading: accessLoading } = useAccess();

  // QBank is one bank practised subject by subject — which upload a question
  // arrived in does not matter to the student.
  const [subjects, setSubjects]       = useState([]);
  const [allSubjects, setAllSubjects] = useState(null);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [subjectId, setSubjectId]     = useState(null);

  // Inside a subject the student picks a topic, or all of the subject's topics.
  const [topicId, setTopicId]         = useState(null);
  const [subjectTopics, setSubjectTopics] = useState(null);

  // Narrows practice to the student's own questions: 'incorrect' or 'bookmarked'.
  const [only, setOnly]               = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());

  // The full ordered id list for the open subject, plus the questions fetched
  // so far, keyed by id.
  const [questionIds, setQuestionIds] = useState([]);
  const [questionsById, setQuestionsById] = useState({});
  const [loading, setLoading]         = useState(true);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const [checking, setChecking]       = useState(false);
  const [checked, setChecked]         = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [answered, setAnswered]       = useState({});
  const [resuming, setResuming]       = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting]     = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const isAllSubjects = subjectId === ALL_SUBJECTS;
  const isPractising = subjectId !== null && topicId !== null;
  // Bookmarks are one list across the bank, so practising them is not the
  // "All subjects" run and keeps to the default scope.
  const practiceScope = isAllSubjects && only !== 'bookmarked'
    ? PRACTICE_SCOPE_BY_MODE.allSubjects
    : PRACTICE_SCOPE_BY_MODE.subject;
  const practiceFilter = {
    ...(subjectId && !isAllSubjects ? { subject_id: subjectId } : {}),
    ...(topicId && topicId !== ALL_TOPICS ? { topic_id: topicId } : {}),
    ...(only ? { only, practice_scope: practiceScope } : {}),
  };
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? 'Question Bank';
  const groupName = isAllSubjects
    ? 'All subjects'
    : topicId === ALL_TOPICS
      ? `All of ${subjectName}`
      : subjectTopics?.topics.find((t) => t.id === topicId)?.name ?? subjectName;
  const practiceName = only === 'bookmarked'
    ? 'Bookmarked'
    : only === 'incorrect' ? `${groupName} · Incorrect` : groupName;

  const loadSubjects = useCallback(() => {
    return getQuestionSubjects({ source_type: 'qbank' })
      .then((res) => {
        setSubjects(res.data?.data?.subjects ?? []);
        setAllSubjects(res.data?.data?.all_subjects ?? null);
      })
      .catch(() => {
        setSubjects([]);
        setAllSubjects(null);
      })
      .finally(() => setSubjectsLoaded(true));
  }, []);

  const loadBookmarks = useCallback(() => {
    return getQuestionIds({ source_type: 'qbank', only: 'bookmarked' })
      .then((res) => setBookmarkedIds(new Set(res.data?.data ?? [])))
      .catch(() => { /* bookmarks are optional; the stars just stay empty */ });
  }, []);

  useEffect(() => {
    if (subjectId === null) {
      loadSubjects();
      loadBookmarks();
    }
  }, [subjectId, loadSubjects, loadBookmarks]);

  useEffect(() => {
    if (subjectId === null || isAllSubjects || topicId !== null) return;
    setSubjectTopics(null);
    getQuestionTopics({ source_type: 'qbank', subject_id: subjectId })
      .then((res) => setSubjectTopics(res.data?.data ?? { subject: null, topics: [] }))
      .catch(() => setSubjectTopics({ subject: null, topics: [] }));
  }, [subjectId, isAllSubjects, topicId]);

  const loadQuestionIds = useCallback(async () => {
    setLoading(true);
    setQuestionsById({});
    setCurrentIdx(0);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
    try {
      const [idsRes, progressRes] = await Promise.all([
        getQuestionIds({ source_type: 'qbank', ...practiceFilter }),
        getPracticeProgress({ source_type: 'qbank', ...practiceFilter, practice_scope: practiceScope })
          .catch(() => null),
      ]);

      const ids = idsRes.data?.data ?? [];
      setQuestionIds(ids);

      const answeredMap = Object.fromEntries(
        (progressRes?.data?.data?.answers ?? []).map((a) => [a.question_id, Boolean(a.is_correct)])
      );
      // Redoing incorrect or bookmarked questions is a fresh pass: the score
      // counts this session, and every question starts unanswered.
      setAnswered(only ? {} : answeredMap);

      const firstUnanswered = only ? 0 : ids.findIndex((id) => !(id in answeredMap));
      const resumeAt = firstUnanswered === -1 ? 0 : firstUnanswered;
      setCurrentIdx(resumeAt);
      setResuming(resumeAt > 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
    // practiceFilter and practiceScope are derived from subjectId, topicId and only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, topicId, only]);

  useEffect(() => {
    if (isPractising) loadQuestionIds();
  }, [loadQuestionIds, isPractising]);

  const currentId = questionIds[currentIdx];
  const q = currentId ? questionsById[currentId] : undefined;

  // Fetch the page holding the current question when it is not loaded yet.
  // Pages line up with the id list: same filter, same order.
  useEffect(() => {
    if (loading || !currentId || questionsById[currentId]) return;
    let isCancelled = false;
    getQuestions({
      source_type: 'qbank',
      ...practiceFilter,
      is_active: true,
      limit: PAGE_SIZE,
      page: Math.floor(currentIdx / PAGE_SIZE) + 1,
    })
      .then((res) => {
        if (isCancelled) return;
        const fetched = Object.fromEntries((res.data?.data ?? []).map((item) => [item.id, item]));
        setQuestionsById((prev) => ({ ...prev, ...fetched }));
        // A question added or removed since the id list was taken shifts the
        // pages, so fall back to fetching the current one on its own.
        if (!fetched[currentId]) {
          return getQuestionById(currentId).then((single) => {
            const item = single.data?.data ?? single.data;
            if (!isCancelled && item) setQuestionsById((prev) => ({ ...prev, [item.id]: item }));
          });
        }
      })
      .catch(() => { /* the spinner stays; moving on retries */ });
    return () => { isCancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, currentId, currentIdx, questionsById]);

  const score = useMemo(() => {
    let correct = 0, wrong = 0;
    for (const id of questionIds) {
      if (!(id in answered)) continue;
      answered[id] ? correct++ : wrong++;
    }
    return { correct, wrong };
  }, [questionIds, answered]);

  const isCorrect = checkResult?.is_correct;
  const correctOpt = checkResult?.options?.find((o) => o.is_correct);
  const revealMap = checkResult
    ? Object.fromEntries(checkResult.options.map((o) => [o.id, o]))
    : {};

  const handleSelect = async (optId) => {
    if (checked || checking) return;
    setSelectedId(optId);
    setChecking(true);
    try {
      const res = await checkAnswer(q.id, { selected_option_id: optId, practice_scope: practiceScope });
      const result = res.data?.data ?? res.data;
      setCheckResult(result);
      setChecked(true);
      setAnswered((prev) => ({ ...prev, [q.id]: Boolean(result.is_correct) }));
    } catch {
      setSelectedId(null);
    } finally {
      setChecking(false);
    }
  };

  const toggleBookmark = async (questionId) => {
    const isBookmarked = bookmarkedIds.has(questionId);
    const update = (shouldHave) => setBookmarkedIds((prev) => {
      const next = new Set(prev);
      shouldHave ? next.add(questionId) : next.delete(questionId);
      return next;
    });
    update(!isBookmarked);
    try {
      await (isBookmarked ? removeBookmark(questionId) : addBookmark(questionId));
    } catch {
      update(isBookmarked);
    }
  };

  const handleStartOver = async () => {
    setResetting(true);
    try {
      await resetPracticeProgress({ source_type: 'qbank', ...practiceFilter, practice_scope: practiceScope });
      setAnswered({});
      setCurrentIdx(0);
      setSelectedId(null);
      setChecked(false);
      setCheckResult(null);
      setResuming(false);
      setConfirmReset(false);
    } catch { /* left on screen to retry */ }
    finally { setResetting(false); }
  };

  const go = (dir) => {
    const next = currentIdx + dir;
    if (next < 0 || next >= questionIds.length) return;
    setResuming(false);
    setCurrentIdx(next);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
  };

  const images = q
    ? (q.question_images?.length ? q.question_images : q.question_image ? [q.question_image] : [])
    : [];

  if (accessLoading) {
    return (
      <DashboardLayout active="qbank">
        <div className="p-16 text-center text-sm text-slate-400">Loading…</div>
      </DashboardLayout>
    );
  }

  const showingSamples = !sections.qbank && samples.qbank > 0;
  const hasPlan = Boolean(sections.qbank);

  // ── Subject picker ──────────────────────────────────────────────────────────
  if (subjectsLoaded && subjectId === null) {
    const bankTotals = {
      total: allSubjects?.question_count ?? 0,
      available: allSubjects?.available_count ?? 0,
      answered: allSubjects?.answered_count ?? 0,
      correct: allSubjects?.correct_count ?? 0,
    };

    return (
      <DashboardLayout active="qbank">
        {showingSamples && <SampleBanner count={samples.qbank} noun="questions" />}
        <div className="min-h-full bg-slate-50 py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
              <p className="text-slate-500 text-sm mt-1">
                Pick a subject and work through every question in it, with full explanations.
              </p>
            </div>

            {!hasPlan && bankTotals.available < bankTotals.total && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-violet text-white">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-slate-900">The full question bank comes with any plan.</span>{' '}
                    <span className="text-slate-500">Free sample questions are open to everyone.</span>
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

            {subjects.length === 0 ? (
              <div className="text-center py-24">
                <Layers className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No questions are available yet.</p>
                <p className="text-slate-300 text-sm mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SubjectCard
                  title="All subjects"
                  subtitle="The whole bank, every subject mixed"
                  total={bankTotals.total}
                  available={bankTotals.available}
                  answered={bankTotals.answered}
                  correct={bankTotals.correct}
                  hasPlan={hasPlan}
                  onOpen={() => {
                    setSubjectId(ALL_SUBJECTS);
                    setTopicId(ALL_TOPICS);
                  }}
                  onRedoIncorrect={() => {
                    setSubjectId(ALL_SUBJECTS);
                    setTopicId(ALL_TOPICS);
                    setOnly('incorrect');
                  }}
                />
                {bookmarkedIds.size > 0 && (
                  <SubjectCard
                    title="Bookmarked"
                    subtitle="Questions you saved to come back to"
                    total={bookmarkedIds.size}
                    available={bookmarkedIds.size}
                    answered={0}
                    correct={0}
                    hasPlan={hasPlan}
                    onOpen={() => {
                      setSubjectId(ALL_SUBJECTS);
                      setTopicId(ALL_TOPICS);
                      setOnly('bookmarked');
                    }}
                  />
                )}
                {subjects.map((s) => (
                  <SubjectCard
                    key={s.id}
                    title={s.name}
                    total={s.question_count}
                    available={s.available_count}
                    answered={s.answered_count}
                    correct={s.correct_count}
                    hasPlan={hasPlan}
                    onOpen={() => setSubjectId(s.id)}
                    onRedoIncorrect={() => {
                      setSubjectId(s.id);
                      setTopicId(ALL_TOPICS);
                      setOnly('incorrect');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Topic picker (inside one subject) ────────────────────────────────────────
  if (subjectId !== null && topicId === null) {
    const subjectSummary = subjectTopics?.subject;

    return (
      <DashboardLayout active="qbank">
        {showingSamples && <SampleBanner count={samples.qbank} noun="questions" />}
        <div className="min-h-full bg-slate-50 py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => setSubjectId(null)}
              className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              All subjects
            </button>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">{subjectName}</h1>
              <p className="text-slate-500 text-sm mt-1">
                Practise the whole subject, or narrow it down to one topic.
              </p>
            </div>

            {!subjectTopics ? (
              <div className="p-16 text-center">
                <div className="w-7 h-7 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectSummary && (
                  <SubjectCard
                    title={`All of ${subjectName}`}
                    subtitle="Every topic in this subject"
                    total={subjectSummary.question_count}
                    available={subjectSummary.available_count}
                    answered={subjectSummary.answered_count}
                    correct={subjectSummary.correct_count}
                    hasPlan={hasPlan}
                    onOpen={() => setTopicId(ALL_TOPICS)}
                    onRedoIncorrect={() => {
                      setTopicId(ALL_TOPICS);
                      setOnly('incorrect');
                    }}
                  />
                )}
                {subjectTopics.topics.map((t) => (
                  <SubjectCard
                    key={t.id}
                    title={t.name}
                    total={t.question_count}
                    available={t.available_count}
                    answered={t.answered_count}
                    correct={t.correct_count}
                    hasPlan={hasPlan}
                    onOpen={() => setTopicId(t.id)}
                    onRedoIncorrect={() => {
                      setTopicId(t.id);
                      setOnly('incorrect');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="qbank">
      {showingSamples && <SampleBanner count={samples.qbank} noun="questions" />}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
            <div>
              <h1 className="text-sm font-bold text-slate-900">Question Bank</h1>
              <p className="text-xs text-slate-400">{practiceName} · {questionIds.length} questions</p>
            </div>
            {(score.correct + score.wrong) > 0 && (
              <span className="text-xs font-medium text-slate-500">
                <span className="text-green-600">{score.correct}</span>
                {' / '}
                <span className="text-red-500">{score.wrong}</span>
              </span>
            )}
          </div>

          {/* Which subject is open, and the way back */}
          <div className="bg-white border-b border-slate-200 px-3 md:px-5 py-2.5 flex items-center gap-3">
            <button
              onClick={() => {
                // Back one level: to the topics of this subject, or to the
                // subject list when practising the whole bank.
                if (isAllSubjects) setSubjectId(null);
                setTopicId(null);
                setOnly(null);
                setQuestionIds([]);
                setQuestionsById({});
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
              {isAllSubjects ? 'All subjects' : subjectName}
            </button>
            <span className="w-px h-4 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-700 truncate">
              {practiceName}
            </span>
          </div>

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {loading || (questionIds.length > 0 && !q) ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <div className="w-7 h-7 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : questionIds.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <p className="text-slate-400 text-sm">
                  {only === 'incorrect' ? 'Nothing to redo — no incorrect answers here.' : 'No questions here yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {resuming && (
                  <div className="px-5 py-2.5 bg-brand-blue/5 border-b border-brand-blue/10 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <p className="text-xs text-slate-600">
                      Resumed where you left off — you have answered{' '}
                      <strong className="text-slate-700">{score.correct + score.wrong}</strong> of{' '}
                      {questionIds.length}.
                    </p>
                  </div>
                )}

                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500">
                        Question <strong className="text-slate-700">{currentIdx + 1}</strong> of {questionIds.length}
                      </span>
                      <button
                        onClick={() => toggleBookmark(q.id)}
                        className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                          bookmarkedIds.has(q.id) ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={bookmarkedIds.has(q.id) ? 'Remove bookmark' : 'Bookmark this question'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(q.id) ? 'fill-current' : ''}`} />
                        {bookmarkedIds.has(q.id) ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    </span>

                    {!only && (score.correct + score.wrong) > 0 && (
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
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1">
                    <div
                      className="bg-brand-blue h-1 rounded-full transition-all duration-500"
                      style={{ width: `${((currentIdx + 1) / questionIds.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="px-5 py-4">
                  {(q.subject?.name || q.topic?.name) && (
                    <span className="inline-block mb-3 text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      {q.subject?.name}{q.topic?.name ? ` · ${q.topic.name}` : ''}
                    </span>
                  )}

                  <p className="text-lg font-semibold text-slate-900 leading-relaxed mb-4">
                    {q.question_text}
                  </p>

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

                  {!checked && !checking && (
                    <p className="text-xs text-slate-400 mb-3 italic">
                      Select an option — explanations will be revealed instantly
                    </p>
                  )}

                  {checked && (
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl mb-3 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <p className={`text-base font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct!' : `Incorrect — correct answer is ${correctOpt?.option_key}`}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {[...(q.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map((opt) => {
                      const isThisSelected = opt.id === selectedId;
                      const isThisCorrect = checked ? (revealMap[opt.id]?.is_correct ?? false) : false;

                      let cardCls, dotCls;
                      if (!checked) {
                        if (checking && isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-wait';
                          dotCls = 'bg-brand-blue text-white';
                        } else if (isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-pointer';
                          dotCls = 'bg-brand-blue text-white';
                        } else {
                          cardCls = checking
                            ? 'border-slate-200 bg-white cursor-not-allowed opacity-60'
                            : 'border-slate-200 bg-white hover:border-brand-blue hover:bg-blue-50/50 cursor-pointer';
                          dotCls = 'bg-slate-100 text-slate-600';
                        }
                      } else if (isThisCorrect) {
                        cardCls = 'border-green-400 bg-green-50 cursor-default';
                        dotCls = 'bg-green-500 text-white';
                      } else if (isThisSelected) {
                        cardCls = 'border-red-400 bg-red-50 cursor-default';
                        dotCls = 'bg-red-500 text-white';
                      } else {
                        cardCls = 'border-slate-200 bg-slate-50 cursor-default';
                        dotCls = 'bg-slate-200 text-slate-500';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect(opt.id)}
                          disabled={checking || checked}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${cardCls}`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${dotCls}`}>
                            {checking && isThisSelected
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : opt.option_key}
                          </span>
                          <span className={`text-base font-medium flex-1 leading-snug ${checked && !isThisCorrect && !isThisSelected ? 'text-slate-500' : 'text-slate-800'}`}>
                            {opt.option_text}
                          </span>
                          {checked && isThisCorrect && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                          {checked && isThisSelected && !isThisCorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanations — every option listed together */}
                  {checked && checkResult && (checkResult.options ?? []).some((o) => o.explanation) && (
                    <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explanations</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[...(checkResult.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map((opt) => {
                          const isThisCorrect = opt.is_correct;
                          const isThisSelected = opt.id === selectedId;
                          let badgeCls = 'bg-slate-200 text-slate-500';
                          if (isThisCorrect) badgeCls = 'bg-green-500 text-white';
                          else if (isThisSelected) badgeCls = 'bg-red-500 text-white';
                          return (
                            <div key={opt.id} className="flex gap-3 px-4 py-3">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${badgeCls}`}>
                                {opt.option_key}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold mb-1 ${isThisCorrect ? 'text-green-700' : isThisSelected ? 'text-red-700' : 'text-slate-700'}`}>
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
                                  ? <ExplanationText text={opt.explanation} className="text-slate-500" />
                                  : <span className="text-sm text-slate-300 italic">No explanation provided.</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {checked && (checkResult?.answer_images?.length > 0 || checkResult?.explanation) && (
                    <div className="flex gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
                      disabled={!checked || currentIdx === questionIds.length - 1}
                      className="px-5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                    >
                      Next Question
                    </button>

                    <button
                      onClick={() => go(1)}
                      disabled={currentIdx === questionIds.length - 1}
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
