import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft, PartyPopper, Zap, Check, RotateCcw,
} from 'lucide-react';
import {
  FlipCard, TapButton, useAnswerAnimation,
} from './FlipCard';

/**
 * A run through a fixed pile of cards from any topics — today's due cards,
 * or a quick random ten.
 *
 * A card marked "Review again" goes to the back of the pile once, so the
 * student meets it again before finishing, while it is still fresh. Its
 * schedule is already set to tomorrow either way.
 */
export const ReviewSession = ({ title, items, topicsById, onAnswer, onExit, onQuickTen }) => {
  const [queue, setQueue] = useState(items);
  const [isFlipped, setIsFlipped] = useState(false);
  const [requeued, setRequeued] = useState(() => new Set());
  const [tally, setTally] = useState({ known: 0, review: 0 });
  // Bumped on every answer so the next card mounts fresh, even when the same
  // card comes round again.
  const [answerCount, setAnswerCount] = useState(0);

  const current = queue[0];
  const topic = current ? topicsById[current.topicId] : null;
  const card = topic?.cards[current.cardIndex];

  const answer = useCallback((isKnown) => {
    if (!current) return;
    onAnswer(current.topicId, current.cardIndex, isKnown);
    setTally((prev) => ({ ...prev, [isKnown ? 'known' : 'review']: prev[isKnown ? 'known' : 'review'] + 1 }));

    const key = `${current.topicId}:${current.cardIndex}`;
    const shouldRequeue = !isKnown && !requeued.has(key);
    if (shouldRequeue) setRequeued((prev) => new Set(prev).add(key));
    setQueue((prev) => (shouldRequeue ? [...prev.slice(1), prev[0]] : prev.slice(1)));
    setIsFlipped(false);
    setAnswerCount((n) => n + 1);
  }, [current, onAnswer, requeued]);

  const { answeredAs, answerWithAnimation } = useAnswerAnimation(answer);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches('input, textarea') || !card) return;
      if (event.key === ' ') {
        event.preventDefault();
        setIsFlipped((v) => !v);
      } else if (isFlipped && (event.key === 'k' || event.key === 'K' || event.key === 'ArrowRight')) answerWithAnimation(true);
      else if (isFlipped && (event.key === 'r' || event.key === 'R' || event.key === 'ArrowLeft')) answerWithAnimation(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, isFlipped, answerWithAnimation]);

  const backButton = (
    <button onClick={onExit} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4">
      <ChevronLeft className="w-4 h-4" />
      Back to overview
    </button>
  );

  if (!card) {
    const reviewed = tally.known + tally.review;
    return (
      <div className="max-w-2xl mx-auto">
        {backButton}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <PartyPopper className="w-10 h-10 text-violet-500 mx-auto mb-3" />
          <p className="text-xl font-bold text-slate-900">{reviewed > 0 ? 'Session complete!' : 'Nothing to review here.'}</p>
          {reviewed > 0 && (
            <p className="text-sm text-slate-500 mt-1.5">
              {reviewed} answered · <span className="text-green-600 font-semibold">{tally.known} knew it</span>
              {' · '}<span className="text-orange-600 font-semibold">{tally.review} to review</span>
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={onExit} className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition">
              Back to overview
            </button>
            <button onClick={onQuickTen} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-blue text-white hover:opacity-90 transition">
              <Zap className="w-4 h-4" /> Quick 10 more
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredInSession = tally.known + tally.review;

  return (
    <div className="max-w-3xl mx-auto">
      {backButton}
      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 tabular-nums">
        <span className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-0.5 font-bold text-white">{title}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
          <span
            className="block h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 transition-all"
            style={{ width: `${(answeredInSession / (answeredInSession + queue.length)) * 100}%` }}
          />
        </div>
        <span className="shrink-0">{queue.length} left</span>
      </div>

      <FlipCard
        key={answerCount}
        card={card}
        enterFrom={answerCount > 0 ? 'fade' : null}
        answeredAs={answeredAs}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((v) => !v)}
        onSwipe={(direction) => answer(direction === 'right')}
        frontTag={<><span className="truncate">{topic.subjectName} › {topic.name}</span><span>Question</span></>}
        backTag={<><span>Learning point {current.cardIndex + 1}</span><span className="truncate">{topic.name}</span></>}
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <TapButton
          tap={isFlipped ? { scale: 0.92, rotate: -2 } : { scale: 0.95 }}
          onClick={() => (isFlipped ? answerWithAnimation(false) : setIsFlipped(true))}
          className={`flex items-center justify-center gap-1.5 py-3 text-sm font-bold rounded-xl text-white shadow-sm hover:opacity-90 transition-opacity ${isFlipped ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'col-span-2 bg-teal-700 hover:bg-teal-800'}`}
        >
          {isFlipped ? <><RotateCcw className="w-4 h-4" /> Review again</> : 'Reveal answer'}
        </TapButton>
        {isFlipped && (
          <TapButton tap={{ scale: 0.92, rotate: 2 }} onClick={() => answerWithAnimation(true)} className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm hover:opacity-90 transition-opacity">
            <Check className="w-4 h-4" /> I knew it
          </TapButton>
        )}
      </div>
      <p className="hidden md:block mt-2 text-[11px] text-slate-400 text-right">Space flip · → or K knew it · ← or R review</p>
    </div>
  );
};
