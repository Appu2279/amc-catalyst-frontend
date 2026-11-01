import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import {
  ChevronRight, Search, Layers, PanelLeftClose, PanelLeftOpen, Lock, Sparkles, ArrowRight,
  Flame, Zap, CheckCircle2, Award,
} from 'lucide-react';
import { TopicStudy } from '@/components/flashcards/TopicStudy';
import { ReviewSession } from '@/components/flashcards/ReviewSession';
import { ProgressRing } from '@/components/flashcards/ProgressRing';
import { Celebration } from '@/components/flashcards/Celebration';
import { LockedSection, LOCKED_COPY } from '@/components/LockedSection';
import { getFlashcardDeck } from '@/api/userService';
import {
  DAILY_GOAL, MARKS, loadProgress, saveProgress, recordAnswer, clearTopicProgress,
  getStreak, getTodayCount, getDueCards, countKnownInTopic, getMinutesFor, getToday,
} from '@/utils/flashcardProgress';

// Remembered so a student who prefers the wider card keeps it next visit.
const INDEX_HIDDEN_KEY = 'amc_catalyst_flashcards_index_hidden';

// The topic new students are pointed at first.
const EXAMPLE_TOPIC_ID = 'topic-017';

const QUICK_SESSION_SIZE = 10;

const SESSIONS = Object.freeze({ DUE: 'due', QUICK: 'quick' });

const loadIsIndexHidden = () => {
  try {
    return localStorage.getItem(INDEX_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

/** { cardIndex: 'known' | 'review' } for one topic, the shape the topic screen reads. */
const getTopicMarks = (progress, topicId) => Object.fromEntries(
  Object.entries(progress.cards[topicId] ?? {}).map(([cardIndex, card]) => [cardIndex, card.mark])
);

const getTopicStats = (topic, progress) => {
  const cards = Object.values(progress.cards[topic.id] ?? {});
  return {
    known: cards.filter((c) => c.mark === MARKS.KNOWN).length,
    review: cards.filter((c) => c.mark === MARKS.REVIEW).length,
    total: topic.card_count,
  };
};

const matchesSearch = (subject, topic, search) => !search
  || topic.name.toLowerCase().includes(search)
  || subject.name.toLowerCase().includes(search)
  || topic.cards.some((card) => card.answer.toLowerCase().includes(search) || card.question.toLowerCase().includes(search));

const shuffled = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const SubjectIndex = ({ deck, progress, currentTopicId, onOpenTopic, onOpenHome }) => {
  const [search, setSearch] = useState('');
  const [openSubjects, setOpenSubjects] = useState(() => new Set());
  const query = search.trim().toLowerCase();

  const toggleSubject = (name) => setOpenSubjects((prev) => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const visibleSubjects = deck.subjects
    .map((subject) => ({ ...subject, topics: subject.topics.filter((t) => matchesSearch(subject, t, query)) }))
    .filter((subject) => subject.topics.length > 0);

  return (
    <div className="p-3">
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand-blue">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics or keywords"
          className="w-full text-sm outline-none bg-transparent"
        />
      </label>
      <button onClick={onOpenHome} className="mt-2 w-full text-left px-3 py-2 text-sm font-semibold text-brand-blue rounded-lg hover:bg-slate-100 transition">
        All subjects overview
      </button>

      {visibleSubjects.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No topics match that search.</p>}

      {visibleSubjects.map((subject) => {
        // A search opens every matching subject, and the open topic's subject
        // stays open so the student can see where they are.
        const isOpen = Boolean(query) || openSubjects.has(subject.name)
          || subject.topics.some((t) => t.id === currentTopicId);
        const cardCount = subject.topics.reduce((sum, t) => sum + t.card_count, 0);
        return (
          <div key={subject.name}>
            <button
              onClick={() => toggleSubject(subject.name)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100 transition"
            >
              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              <span className="flex-1 text-left">{subject.name}</span>
              <span className="text-xs font-normal text-slate-400 tabular-nums">{cardCount}</span>
            </button>
            {isOpen && (
              <div className="ml-4 mb-1">
                {subject.topics.map((topic) => {
                  const { known, review, total } = getTopicStats(topic, progress);
                  const dotCls = known === total ? 'bg-green-500' : known || review ? 'bg-amber-400' : 'bg-slate-200';
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onOpenTopic(topic.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-left rounded-md transition ${
                        topic.id === currentTopicId ? 'bg-brand-blue/10 text-brand-blue font-semibold' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {topic.is_locked
                        ? <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                        : <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />}
                      <span className="flex-1">{topic.name}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums">{total}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Streak, daily goal and today's due pile — the reason to open Flashcards every day. */
const TodayPanel = ({ streak, todayCount, dueCount, onStartDue, onQuickTen }) => {
  const isGoalMet = todayCount >= DAILY_GOAL;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-brand-blue text-white p-5 md:p-6 mb-5">
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${streak > 0 ? 'bg-amber-400/25' : 'bg-white/15'}`}>
            <Flame className={`w-7 h-7 ${streak > 0 ? 'text-amber-300 fill-amber-300/40' : 'text-white/60'}`} />
          </span>
          <div>
            <p className="text-2xl font-black leading-none tabular-nums">{streak}</p>
            <p className="text-xs text-white/75 mt-1">{streak > 0 ? 'day streak' : 'start a streak today'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProgressRing value={todayCount / DAILY_GOAL} size={52} strokeWidth={5} colorClass="text-white" trackClass="stroke-white/25">
            {isGoalMet
              ? <CheckCircle2 className="w-5 h-5 text-white" />
              : <span className="text-[11px] font-bold tabular-nums">{todayCount}/{DAILY_GOAL}</span>}
          </ProgressRing>
          <div>
            <p className="text-sm font-bold">{isGoalMet ? 'Daily goal done!' : "Today's goal"}</p>
            <p className="text-xs text-white/75">{isGoalMet ? `${todayCount} cards reviewed today` : `${DAILY_GOAL - todayCount} more cards to go`}</p>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-lg font-bold">
            {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? '' : 's'} due today` : 'All caught up'}
          </p>
          <p className="text-xs text-white/75">
            {dueCount > 0
              ? `About ${getMinutesFor(dueCount)} min — cards you are learning, back at the right time`
              : 'No cards due. Try a quick 10, or open a new topic.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {dueCount > 0 && (
            <button onClick={onStartDue} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-violet-700 text-sm font-bold shadow-sm hover:bg-violet-50 transition">
              Start review <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={onQuickTen} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/40 text-white text-sm font-bold hover:bg-white/10 transition">
            <Zap className="w-4 h-4" /> Quick 10
          </button>
        </div>
      </div>
    </section>
  );
};

const Overview = ({ deck, topicsById, totalCards, knownTotal, progress, todayPanel, onOpenTopic }) => {
  const example = topicsById[EXAMPLE_TOPIC_ID];
  const topicCount = Object.keys(topicsById).length;
  const masteredPct = totalCards ? Math.round((knownTotal / totalCards) * 100) : 0;

  return (
    <div className="max-w-5xl">
      {todayPanel}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 grid md:grid-cols-[minmax(0,1fr)_auto] gap-5 items-center mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">AMC CAT 1 · Learning points deck</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {knownTotal > 0
              ? <>You have mastered <span className="text-green-600">{masteredPct}%</span> of AMC learning points</>
              : 'Study every learning point, subject by subject'}
          </h1>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <span className="block h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700" style={{ width: `${masteredPct}%` }} />
          </div>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {knownTotal} of {totalCards} cards known. Each card asks a question on the front and gives the learning point
            on the back, and every topic has a flowchart that puts its points in clinical order.
          </p>
        </div>
        <div className="flex gap-6 tabular-nums">
          {[[deck.subjects.length, 'subjects'], [topicCount, 'topics'], [totalCards, 'cards']].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-brand-blue leading-tight">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {!deck.has_access && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-violet text-white">
              <Sparkles className="h-3 w-3" />
            </span>
            <p className="text-sm text-slate-700">
              <span className="font-bold text-slate-900">The full flashcards deck comes with a plan.</span>{' '}
              <span className="text-slate-500">The example topic below is free for everyone.</span>
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

      {example && knownTotal === 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Start here · example topic</p>
            <p className="font-semibold text-slate-900">{example.subjectName} › {example.name}</p>
            <p className="text-sm text-slate-500">{example.card_count} cards plus a flowchart. Try this one first to see how the deck works.</p>
          </div>
          <button onClick={() => onOpenTopic(example.id)} className="px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-lg hover:opacity-90 transition">
            Open example
          </button>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-900 mb-3">All subjects</h2>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {deck.subjects.map((subject) => {
          const total = subject.topics.reduce((sum, t) => sum + t.card_count, 0);
          const known = subject.topics.reduce((sum, t) => sum + getTopicStats(t, progress).known, 0);
          const isLocked = subject.topics.every((t) => t.is_locked);
          const isMastered = !isLocked && known === total;
          return (
            <button
              key={subject.name}
              onClick={() => onOpenTopic(subject.topics[0].id)}
              className={`bg-white border rounded-xl px-4 py-3.5 text-left flex gap-3 hover:shadow-sm transition ${
                isMastered ? 'border-green-300 hover:border-green-500' : 'border-slate-200 hover:border-brand-blue'
              }`}
            >
              <ProgressRing value={total ? known / total : 0} size={44} strokeWidth={4}>
                {isLocked
                  ? <Lock className="w-3.5 h-3.5 text-slate-300" />
                  : isMastered
                    ? <Award className="w-4 h-4 text-green-600" />
                    : <span className="text-[10px] font-bold text-slate-600 tabular-nums">{Math.round((known / total) * 100)}%</span>}
              </ProgressRing>
              <span className="flex flex-col gap-1 min-w-0">
                <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
                  {subject.name}
                  {isMastered && <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Mastered</span>}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {subject.topics.length} topics · {total} cards · {known} known
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">{subject.topics.map((t) => t.name).join(' · ')}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-slate-400">Progress, streak and due cards are saved in this browser only.</p>
    </div>
  );
};

export const Flashcards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [progress, setProgress] = useState(loadProgress);
  // Phones: the subject index is an overlay drawer, closed by default.
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  // Desktop: the index sits beside the card and can be slid away.
  const [isIndexHidden, setIsIndexHidden] = useState(loadIsIndexHidden);
  const [deck, setDeck] = useState(null);
  const [isDeckFailed, setIsDeckFailed] = useState(false);
  // The cards of a running review session, fixed when it starts so answering
  // a card does not reshuffle the pile underneath the student.
  const [sessionItems, setSessionItems] = useState(null);
  const [sessionRun, setSessionRun] = useState(0);
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    getFlashcardDeck()
      .then((res) => setDeck(res.data?.data ?? null))
      .catch(() => setIsDeckFailed(true));
  }, []);

  useEffect(() => saveProgress(progress), [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(INDEX_HIDDEN_KEY, String(isIndexHidden));
    } catch {
      // Not remembering the panel state is harmless.
    }
  }, [isIndexHidden]);

  const topicsById = useMemo(() => Object.fromEntries((deck?.subjects ?? []).flatMap((subject) => (
    subject.topics.map((t) => [t.id, { ...t, subjectName: subject.name }])
  ))), [deck]);
  const totalCards = useMemo(
    () => Object.values(topicsById).reduce((sum, t) => sum + t.card_count, 0),
    [topicsById]
  );
  const knownTotal = useMemo(
    () => Object.values(topicsById).reduce((sum, t) => sum + getTopicStats(t, progress).known, 0),
    [topicsById, progress]
  );

  // A lapsed plan locks topics again; their due cards wait rather than error.
  const isTopicOpen = useCallback((topicId) => Boolean(topicsById[topicId] && !topicsById[topicId].is_locked), [topicsById]);
  const dueCards = useMemo(
    () => getDueCards(progress, isTopicOpen).filter(({ topicId, cardIndex }) => topicsById[topicId].cards[cardIndex]),
    [progress, isTopicOpen, topicsById]
  );

  const topic = topicsById[searchParams.get('topic')];
  const sessionKind = searchParams.get('session');

  const buildSession = useCallback((kind) => {
    if (kind === SESSIONS.DUE) return dueCards.map(({ topicId, cardIndex }) => ({ topicId, cardIndex }));
    const openCards = Object.values(topicsById)
      .filter((t) => !t.is_locked)
      .flatMap((t) => t.cards.map((_, cardIndex) => ({ topicId: t.id, cardIndex })));
    return shuffled(openCards).slice(0, QUICK_SESSION_SIZE);
  }, [dueCards, topicsById]);

  // Opening /flashcards?session=due directly (the Dashboard widget links here)
  // builds the pile once the deck has loaded.
  useEffect(() => {
    if (!deck) return;
    if (!sessionKind) setSessionItems(null);
    else if (!sessionItems) setSessionItems(buildSession(sessionKind));
  }, [deck, sessionKind, sessionItems, buildSession]);

  const startSession = (kind) => {
    setSessionItems(buildSession(kind));
    setSessionRun((n) => n + 1);
    setSearchParams({ session: kind });
    setIsIndexOpen(false);
  };

  // In the URL so a topic can be bookmarked or shared, and Back works.
  const openTopic = (topicId) => {
    setSearchParams({ topic: topicId });
    setIsIndexOpen(false);
  };
  const openHome = () => {
    setSearchParams({});
    setIsIndexOpen(false);
  };

  const handleAnswer = useCallback((topicId, cardIndex, isKnown) => {
    const answeredTopic = topicsById[topicId];
    let next = recordAnswer(progress, topicId, cardIndex, isKnown);

    const today = getToday();
    const hasJustMetGoal = getTodayCount(progress) < DAILY_GOAL && getTodayCount(next) >= DAILY_GOAL
      && progress.goalCelebratedOn !== today;
    const hasJustMastered = countKnownInTopic(progress, topicId) < answeredTopic.card_count
      && countKnownInTopic(next, topicId) === answeredTopic.card_count;

    if (hasJustMetGoal) next = { ...next, goalCelebratedOn: today };
    if (hasJustMastered) setCelebration({ id: Date.now(), message: `🏆 ${answeredTopic.name} mastered!` });
    else if (hasJustMetGoal) setCelebration({ id: Date.now(), message: `🔥 Daily goal reached — ${DAILY_GOAL} cards today!` });

    setProgress(next);
  }, [progress, topicsById]);

  const markTopicCard = useCallback(
    (cardIndex, mark) => handleAnswer(topic.id, cardIndex, mark === MARKS.KNOWN),
    [handleAnswer, topic]
  );

  if (!deck) {
    return (
      <DashboardLayout active="flashcards">
        <div className="p-16 text-center text-sm text-slate-400">
          {isDeckFailed
            ? 'Flashcards could not be loaded. Please refresh the page to try again.'
            : <div className="w-7 h-7 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />}
        </div>
      </DashboardLayout>
    );
  }

  const streak = getStreak(progress);
  const todayCount = getTodayCount(progress);

  let content;
  if (sessionKind && sessionItems) {
    content = (
      <ReviewSession
        key={sessionRun}
        title={sessionKind === SESSIONS.DUE ? 'Due today' : 'Quick 10'}
        items={sessionItems}
        topicsById={topicsById}
        onAnswer={handleAnswer}
        onExit={openHome}
        onQuickTen={() => startSession(SESSIONS.QUICK)}
      />
    );
  } else if (topic?.is_locked) {
    content = <LockedSection {...LOCKED_COPY.flashcards} sampleCount={topicsById[EXAMPLE_TOPIC_ID]?.card_count ?? 0} />;
  } else if (topic) {
    content = (
      // Keyed by topic so the card position and filters start fresh on each topic.
      <TopicStudy
        key={topic.id}
        topic={topic}
        subjectName={topic.subjectName}
        marks={getTopicMarks(progress, topic.id)}
        onMark={markTopicCard}
        onClearMarks={() => setProgress((prev) => clearTopicProgress(prev, topic.id))}
      />
    );
  } else {
    content = (
      <Overview
        deck={deck}
        topicsById={topicsById}
        totalCards={totalCards}
        knownTotal={knownTotal}
        progress={progress}
        onOpenTopic={openTopic}
        todayPanel={(
          <TodayPanel
            streak={streak}
            todayCount={todayCount}
            dueCount={dueCards.length}
            onStartDue={() => startSession(SESSIONS.DUE)}
            onQuickTen={() => startSession(SESSIONS.QUICK)}
          />
        )}
      />
    );
  }

  return (
    <DashboardLayout active="flashcards">
      {celebration && <Celebration key={celebration.id} message={celebration.message} onDone={() => setCelebration(null)} />}

      {/* A fixed height (screen minus the dashboard header, and the bottom
          nav on phones) so the subject index and the card scroll on their own
          instead of the whole page scrolling together. */}
      <div className="relative flex overflow-hidden h-[calc(100dvh-9rem)] md:h-[calc(100dvh-4rem)]">
        {/* Desktop: slides by animating its width; the inner panel keeps a
            fixed width so the text slides out rather than squashing. */}
        <aside
          className={`hidden md:block shrink-0 overflow-hidden bg-white transition-[width] duration-300 ease-out ${
            isIndexHidden ? 'w-0' : 'w-72 border-r border-slate-200'
          }`}
          aria-hidden={isIndexHidden}
        >
          <div className="w-72 h-full overflow-y-auto overscroll-contain">
            <SubjectIndex deck={deck} progress={progress} currentTopicId={topic?.id} onOpenTopic={openTopic} onOpenHome={openHome} />
          </div>
        </aside>

        {/* Phones: a drawer that slides in over the card. */}
        <div
          onClick={() => setIsIndexOpen(false)}
          className={`md:hidden absolute inset-0 z-20 bg-slate-900/30 transition-opacity duration-300 ${
            isIndexOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
        />
        <aside
          className={`md:hidden absolute inset-y-0 left-0 z-30 w-72 max-w-[85%] bg-white shadow-xl overflow-y-auto overscroll-contain transition-transform duration-300 ease-out ${
            isIndexOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!isIndexOpen}
        >
          <SubjectIndex deck={deck} progress={progress} currentTopicId={topic?.id} onOpenTopic={openTopic} onOpenHome={openHome} />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50">
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center gap-3">
            <button
              onClick={() => setIsIndexHidden((v) => !v)}
              title={isIndexHidden ? 'Show subjects' : 'Hide subjects'}
              aria-label={isIndexHidden ? 'Show subjects' : 'Hide subjects'}
              className="hidden md:block p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              {isIndexHidden ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsIndexOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              Subjects
            </button>
            <Layers className="hidden md:block w-4 h-4 text-brand-blue shrink-0" />
            <span className="hidden md:inline text-sm font-bold text-slate-900">Flashcards</span>
            <span className="flex-1" />
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 tabular-nums" title="Day streak">
              <Flame className="w-4 h-4" /> {streak}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              <strong className="text-slate-800">{knownTotal}/{totalCards}</strong> known
            </span>
          </div>

          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            {content}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};
