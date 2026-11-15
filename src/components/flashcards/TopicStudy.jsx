import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, Shuffle, RotateCcw, Eye, EyeOff, Award, Check } from 'lucide-react';
import { MARKS } from '@/utils/flashcardProgress';
import {
  FlipCard, GuidelineUpdate, TapButton, useAnswerAnimation,
} from './FlipCard';
import { getSubjectColor } from './subjectColors';

const TABS = [
  { key: 'cards', label: 'Flashcards' },
  { key: 'flowchart', label: 'Flowchart' },
  { key: 'points', label: 'All points' },
];

const getAllIndexes = (topic) => topic.cards.map((_, i) => i);

const CardsPane = ({ topic, color, marks, onMark, onClearMarks }) => {
  const [order, setOrder] = useState(() => getAllIndexes(topic));
  const [pos, setPos] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isUnknownOnly, setIsUnknownOnly] = useState(false);
  // Bumped on every mark so a swiped card is replaced by a fresh one even on
  // the last card, where the position does not change.
  const [markCount, setMarkCount] = useState(0);
  const [enterFrom, setEnterFrom] = useState(null);

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
    setEnterFrom('fade');
    moveTo(pos + 1);
  }, [onMark, cardIndex, moveTo, pos]);

  const { answeredAs, answerWithAnimation } = useAnswerAnimation(
    (isKnown) => markAndAdvance(isKnown ? MARKS.KNOWN : MARKS.REVIEW)
  );

  const step = useCallback((delta) => {
    setEnterFrom(delta > 0 ? 'right' : 'left');
    moveTo(pos + delta);
  }, [moveTo, pos]);

  const shuffle = () => {
    const shuffled = [...order];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOrder(shuffled);
    setEnterFrom('shuffle');
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
      } else if (event.key === 'ArrowRight' && pos < order.length - 1) step(1);
      else if (event.key === 'ArrowLeft' && pos > 0) step(-1);
      else if (event.key === 'k' || event.key === 'K') answerWithAnimation(true);
      else if (event.key === 'r' || event.key === 'R') answerWithAnimation(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, pos, order.length, step, answerWithAnimation]);

  if (!card) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <p className="text-lg font-semibold text-slate-800">Nothing left to review in this topic.</p>
        <button
          onClick={studyAllAgain}
          className={`mt-4 px-4 py-2 text-sm font-bold bg-gradient-to-r ${color.gradient} text-white rounded-lg shadow-sm hover:opacity-90 transition`}
        >
          Study all cards again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 tabular-nums">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-bold ${color.soft} ${color.text}`}>Card {pos + 1} of {order.length}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden flex" title={`${knownCount} known, ${reviewCount} to review`}>
          <span className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all" style={{ width: `${(knownCount / topic.cards.length) * 100}%` }} />
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 h-full transition-all" style={{ width: `${(reviewCount / topic.cards.length) * 100}%` }} />
        </div>
        <span className="shrink-0 font-semibold text-green-600">{knownCount} known</span>
      </div>

      <FlipCard
        key={`${cardIndex}-${pos}-${markCount}`}
        card={card}
        enterFrom={enterFrom}
        answeredAs={answeredAs}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((v) => !v)}
        onSwipe={(direction) => markAndAdvance(direction === 'right' ? MARKS.KNOWN : MARKS.REVIEW)}
        frontTag={(
          <>
            <span>Question</span>
            <span className={mark === MARKS.KNOWN ? 'text-green-300' : mark === MARKS.REVIEW ? 'text-orange-300' : ''}>
              {mark === MARKS.KNOWN ? 'Known' : mark === MARKS.REVIEW ? 'Review' : `#${cardIndex + 1}`}
            </span>
          </>
        )}
        backTag={<><span>Learning point {cardIndex + 1}</span><span className="truncate">{topic.name}</span></>}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TapButton tap={{ scale: 0.94, x: -4 }} onClick={() => step(-1)} disabled={pos === 0} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-40 transition-colors">
          Previous
        </TapButton>
        <TapButton tap={{ scale: 0.92 }} onClick={() => setIsFlipped((v) => !v)} className="px-4 py-2 text-sm font-bold rounded-lg bg-teal-700 text-white shadow-sm hover:bg-teal-800 transition-colors">
          {isFlipped ? 'Show question' : 'Reveal answer'}
        </TapButton>
        <TapButton tap={{ scale: 0.94, x: 4 }} onClick={() => step(1)} disabled={pos === order.length - 1} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-40 transition-colors">
          Next
        </TapButton>
        <span className="flex-1" />
        <TapButton tap={{ scale: 0.9, rotate: -3 }} onClick={() => answerWithAnimation(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-200 hover:opacity-90 transition-opacity">
          <RotateCcw className="w-4 h-4" /> Review again
        </TapButton>
        <TapButton tap={{ scale: 0.9, rotate: 3 }} onClick={() => answerWithAnimation(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm shadow-green-200 hover:opacity-90 transition-opacity">
          <Check className="w-4 h-4" /> I knew it
        </TapButton>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TapButton tap={{ scale: 0.92, rotate: -4 }} onClick={shuffle} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition-colors">
          <Shuffle className="w-3.5 h-3.5" /> Shuffle
        </TapButton>
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

const FlowchartPane = ({ topic, color }) => (
  <div className="max-w-3xl">
    {topic.flowchart.map((step, stepIdx) => {
      const isFirst = stepIdx === 0;
      const isLast = stepIdx === topic.flowchart.length - 1;
      return (
        <React.Fragment key={stepIdx}>
          {stepIdx > 0 && (
            <div className="flex justify-center py-1.5" aria-hidden="true">
              <ArrowDown className={`w-5 h-5 ${color.text}`} />
            </div>
          )}
          {/* Boxes side by side are alternative branches at that step. */}
          {step.length > 1 ? (
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
              {step.map((branch) => (
                <div key={branch} className="bg-gradient-to-b from-amber-50 to-white border border-amber-200 border-t-3 border-t-amber-500 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed shadow-sm">
                  {branch}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-xl px-4 py-3 text-sm text-center leading-relaxed ${
                isFirst
                  ? `bg-gradient-to-r ${color.gradient} text-white font-semibold shadow-md`
                  : isLast
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 text-slate-800 font-medium'
                    : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
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

const PointsPane = ({ topic, color }) => {
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
            <li key={i} className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 gap-y-1 shadow-sm hover:shadow-md transition-shadow">
              <span className={`row-span-2 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${color.soft} ${color.text}`}>{i + 1}</span>
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
  const color = getSubjectColor(topic.subjectIndex);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${color.text}`}>
            <span className={`w-2 h-2 rounded-sm bg-gradient-to-br ${color.gradient}`} /> {subjectName}
          </p>
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
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-bold">
                {updateCount} guideline update{updateCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition ${
                tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'cards' && <CardsPane topic={topic} color={color} marks={marks} onMark={onMark} onClearMarks={onClearMarks} />}
      {tab === 'flowchart' && <FlowchartPane topic={topic} color={color} />}
      {tab === 'points' && <PointsPane topic={topic} color={color} />}
    </div>
  );
};
