import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, Shuffle, RotateCcw, Eye, EyeOff, Award } from 'lucide-react';
import { MARKS } from '@/utils/flashcardProgress';
import { FlipCard, GuidelineUpdate } from './FlipCard';

const TABS = [
  { key: 'cards', label: 'Flashcards' },
  { key: 'flowchart', label: 'Flowchart' },
  { key: 'points', label: 'All points' },
];

const getAllIndexes = (topic) => topic.cards.map((_, i) => i);

const CardsPane = ({ topic, marks, onMark, onClearMarks }) => {
  const [order, setOrder] = useState(() => getAllIndexes(topic));
  const [pos, setPos] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isUnknownOnly, setIsUnknownOnly] = useState(false);
  // Bumped on every mark so a swiped card is replaced by a fresh one even on
  // the last card, where the position does not change.
  const [markCount, setMarkCount] = useState(0);

  const cardIndex = order[pos];
  const card = topic.cards[cardIndex];
  const mark = marks[cardIndex];
  const knownCount = topic.cards.filter((_, i) => marks[i] === MARKS.KNOWN).length;
  const reviewCount = topic.cards.filter((_, i) => marks[i] === MARKS.REVIEW).length;

  const moveTo = useCallback((nextPos) => {
    setPos(Math.min(order.length - 1, Math.max(0, nextPos)));
    setIsFlipped(false);
  }, [order.length]);

  // Marking moves on to the next card, except on the last one, where the
  // student stays put rather than being bounced back to the start.
  const markAndAdvance = useCallback((value) => {
    onMark(cardIndex, value);
    setMarkCount((n) => n + 1);
    moveTo(pos + 1);
  }, [onMark, cardIndex, moveTo, pos]);

  const shuffle = () => {
    const shuffled = [...order];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOrder(shuffled);
    moveTo(0);
  };

  const toggleUnknownOnly = () => {
    const isTurningOn = !isUnknownOnly;
    setIsUnknownOnly(isTurningOn);
    setOrder(getAllIndexes(topic).filter((i) => !isTurningOn || marks[i] !== MARKS.KNOWN));
    setPos(0);
    setIsFlipped(false);
  };

  const studyAllAgain = () => {
    setIsUnknownOnly(false);
    setOrder(getAllIndexes(topic));
    moveTo(0);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches('input, textarea') || !card) return;
      if (event.key === ' ') {
        event.preventDefault();
        setIsFlipped((v) => !v);
      } else if (event.key === 'ArrowRight') moveTo(pos + 1);
      else if (event.key === 'ArrowLeft') moveTo(pos - 1);
      else if (event.key === 'k' || event.key === 'K') markAndAdvance(MARKS.KNOWN);
      else if (event.key === 'r' || event.key === 'R') markAndAdvance(MARKS.REVIEW);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, pos, moveTo, markAndAdvance]);

  if (!card) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <p className="text-lg font-semibold text-slate-800">Nothing left to review in this topic.</p>
        <button
          onClick={studyAllAgain}
          className="mt-4 px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-lg hover:opacity-90 transition"
        >
          Study all cards again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 tabular-nums">
        <span className="shrink-0">Card {pos + 1} of {order.length}</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden flex" title={`${knownCount} known, ${reviewCount} to review`}>
          <span className="bg-green-500 h-full transition-all" style={{ width: `${(knownCount / topic.cards.length) * 100}%` }} />
          <span className="bg-orange-400 h-full transition-all" style={{ width: `${(reviewCount / topic.cards.length) * 100}%` }} />
        </div>
        <span className="shrink-0">{knownCount} known</span>
      </div>

      <FlipCard
        key={`${cardIndex}-${pos}-${markCount}`}
        card={card}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((v) => !v)}
        onSwipe={(direction) => markAndAdvance(direction === 'right' ? MARKS.KNOWN : MARKS.REVIEW)}
        frontTag={(
          <>
            <span>Question</span>
            <span className={mark === MARKS.KNOWN ? 'text-green-600' : mark === MARKS.REVIEW ? 'text-orange-500' : ''}>
              {mark === MARKS.KNOWN ? 'Known' : mark === MARKS.REVIEW ? 'Review' : `#${cardIndex + 1}`}
            </span>
          </>
        )}
        backTag={<><span>Learning point {cardIndex + 1}</span><span className="truncate">{topic.name}</span></>}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => moveTo(pos - 1)} disabled={pos === 0} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-40 transition">
          Previous
        </button>
        <button onClick={() => setIsFlipped((v) => !v)} className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-blue text-white hover:opacity-90 transition">
          {isFlipped ? 'Show question' : 'Reveal answer'}
        </button>
        <button onClick={() => moveTo(pos + 1)} disabled={pos === order.length - 1} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-40 transition">
          Next
        </button>
        <span className="flex-1" />
        <button onClick={() => markAndAdvance(MARKS.REVIEW)} className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition">
          Review again
        </button>
        <button onClick={() => markAndAdvance(MARKS.KNOWN)} className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition">
          I knew it
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={shuffle} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition">
          <Shuffle className="w-3.5 h-3.5" /> Shuffle
        </button>
        <button onClick={toggleUnknownOnly} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition">
          {isUnknownOnly ? 'Study all cards' : 'Study cards not yet known'}
        </button>
        <button onClick={onClearMarks} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition">
          <RotateCcw className="w-3.5 h-3.5" /> Clear marks for this topic
        </button>
        <span className="flex-1" />
        <span className="hidden md:inline text-[11px] text-slate-400">
          Space flip · ← → move · K knew · R review
        </span>
      </div>
    </div>
  );
};

const FlowchartPane = ({ topic }) => (
  <div className="max-w-3xl">
    {topic.flowchart.map((step, stepIdx) => {
      const isFirst = stepIdx === 0;
      const isLast = stepIdx === topic.flowchart.length - 1;
      return (
        <React.Fragment key={stepIdx}>
          {stepIdx > 0 && (
            <div className="flex justify-center py-1.5" aria-hidden="true">
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </div>
          )}
          {/* Boxes side by side are alternative branches at that step. */}
          {step.length > 1 ? (
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
              {step.map((branch) => (
                <div key={branch} className="bg-white border border-slate-200 border-t-3 border-t-amber-500 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  {branch}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-xl px-4 py-3 text-sm text-center leading-relaxed ${
                isFirst
                  ? 'bg-brand-blue text-white font-semibold'
                  : isLast
                    ? 'bg-white border-2 border-green-600 text-slate-800'
                    : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {step[0]}
            </div>
          )}
        </React.Fragment>
      );
    })}
    <p className="mt-4 text-xs text-slate-400">
      Built only from this topic's {topic.cards.length} learning points. Boxes side by side are alternative branches.
    </p>
  </div>
);

const PointsPane = ({ topic }) => {
  const [isHidingAnswers, setIsHidingAnswers] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());

  const toggleHiding = () => {
    setIsHidingAnswers((v) => !v);
    setRevealed(new Set());
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={toggleHiding} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition">
          {isHidingAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isHidingAnswers ? 'Show answers' : 'Hide answers'}
        </button>
        {isHidingAnswers && <span className="text-[11px] text-slate-400">Tap a hidden answer to reveal it</span>}
      </div>

      <ol className="space-y-2.5">
        {topic.cards.map((card, i) => {
          const isHidden = isHidingAnswers && !revealed.has(i);
          return (
            <li key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-1">
              <span className="row-span-2 font-bold text-amber-600 tabular-nums">{i + 1}</span>
              <p className="text-sm font-semibold text-slate-800">{card.question}</p>
              <div
                onClick={() => isHidden && setRevealed((prev) => new Set(prev).add(i))}
                className={`text-[15px] text-slate-700 leading-relaxed transition ${isHidden ? 'blur-sm select-none cursor-pointer' : ''}`}
              >
                {card.answer}
                {card.guidelineUpdate && <GuidelineUpdate text={card.guidelineUpdate} />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/** One topic's study screen: flip cards, its flowchart, or every point as a list. */
export const TopicStudy = ({ topic, subjectName, marks, onMark, onClearMarks }) => {
  const [tab, setTab] = useState('cards');
  const updateCount = topic.cards.filter((c) => c.guidelineUpdate).length;
  const isMastered = topic.cards.every((_, i) => marks[i] === MARKS.KNOWN);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{subjectName}</p>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900 mt-0.5">
            {topic.name}
            {isMastered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                <Award className="w-3.5 h-3.5" /> Mastered
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {topic.cards.length} cards
            {updateCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">
                {updateCount} guideline update{updateCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition ${
                tab === key ? 'bg-brand-blue text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'cards' && <CardsPane topic={topic} marks={marks} onMark={onMark} onClearMarks={onClearMarks} />}
      {tab === 'flowchart' && <FlowchartPane topic={topic} />}
      {tab === 'points' && <PointsPane topic={topic} />}
    </div>
  );
};
