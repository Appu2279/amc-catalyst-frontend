import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';

// How far a revealed card must be dragged before letting go counts as a swipe.
const SWIPE_THRESHOLD_PX = 110;
const FLY_OFF_MS = 220;

// How long an answered card shows its green/orange tint before fading out.
const ANSWER_HOLD_MS = 650;

// Where a newly shown card animates in from. Transform + opacity only, so it
// stays smooth on phones and tablets.
const ENTER_FROM = {
  right: { x: 70, opacity: 0 },
  left: { x: -70, opacity: 0 },
  fade: { scale: 0.98, opacity: 0 },
  shuffle: { rotate: -8, scale: 0.85, opacity: 0 },
};
const SHOWN = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 30 } };
// The answered card holds its tint for a moment, then fades away.
const FADED_OUT = { scale: 0.98, opacity: 0, transition: { delay: 0.4, duration: 0.25, ease: 'easeOut' } };

const ANSWER_TINTS = {
  known: { overlay: 'bg-green-500/15 ring-4 ring-green-400', badge: 'bg-green-500', icon: Check, label: 'Knew it' },
  review: { overlay: 'bg-orange-500/15 ring-4 ring-orange-400', badge: 'bg-orange-500', icon: RotateCcw, label: 'Review again' },
};

/** A button with a springy press; `tap` sets how it moves while held. */
export const TapButton = ({ tap = { scale: 0.94 }, ...props }) => (
  <motion.button whileTap={tap} transition={{ type: 'spring', stiffness: 600, damping: 25 }} {...props} />
);

/**
 * Answering via button or key: tint the card green/orange, let it fade, then
 * `commit`. After a swipe the card has already flown off, so the swipe
 * handler should call `commit` directly.
 */
export const useAnswerAnimation = (commit) => {
  const [answeredAs, setAnsweredAs] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const answerWithAnimation = (isKnown) => {
    if (answeredAs) return; // ignore double taps while the card is fading
    setAnsweredAs(isKnown ? 'known' : 'review');
    timerRef.current = setTimeout(() => {
      setAnsweredAs(null);
      commit(isKnown);
    }, ANSWER_HOLD_MS);
  };

  return { answeredAs, answerWithAnimation };
};

export const GuidelineUpdate = ({ text }) => (
  <div className="mt-4 border-l-3 border-amber-500 bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-700 leading-relaxed">
    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">Guideline update</span>
    {text}
  </div>
);

/**
 * A flashcard that flips on tap, and once the answer is showing can be swiped:
 * right for "I knew it", left for "Review again".
 *
 * Swiping only works on the answer side — judging a card before seeing the
 * answer would defeat the point. Vertical drags are left to the page
 * (touch-action: pan-y) so long answers still scroll on phones.
 *
 * Render it with a key per card: a new card must start centred, not where the
 * last one flew off to.
 */
export const FlipCard = ({
  card, frontTag, backTag, isFlipped, onFlip, onSwipe, answeredAs, enterFrom,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeExitDirection, setSwipeExitDirection] = useState(0);
  const dragStartRef = useRef(null);
  const hasMovedRef = useRef(false);

  const handlePointerDown = (event) => {
    dragStartRef.current = event.clientX;
    hasMovedRef.current = false;
    if (isFlipped) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (dragStartRef.current === null) return;
    const dx = event.clientX - dragStartRef.current;
    if (Math.abs(dx) > 6) hasMovedRef.current = true;
    if (isFlipped && hasMovedRef.current) {
      setIsDragging(true);
      setDragX(dx);
    }
  };

  const handlePointerUp = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    setIsDragging(false);

    if (!hasMovedRef.current) {
      onFlip();
      return;
    }
    if (isFlipped && Math.abs(dragX) >= SWIPE_THRESHOLD_PX) {
      const direction = dragX > 0 ? 1 : -1;
      setSwipeExitDirection(direction);
      setTimeout(() => onSwipe(direction > 0 ? 'right' : 'left'), FLY_OFF_MS);
      return;
    }
    setDragX(0);
  };

  const offsetX = swipeExitDirection ? swipeExitDirection * window.innerWidth : dragX;
  const tint = ANSWER_TINTS[answeredAs];
  const swipeStrength = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD_PX, 1);

  return (
    <motion.div initial={ENTER_FROM[enterFrom] ?? false} animate={tint ? FADED_OUT : SHOWN}>
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={(event) => event.key === 'Enter' && onFlip()}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Flashcard answer, press to show the question' : 'Flashcard question, press to reveal the answer'}
      className="relative perspective-[1600px] cursor-pointer select-none touch-pan-y"
      style={{
        transform: `translateX(${offsetX}px) rotate(${offsetX / 18}deg)`,
        transition: isDragging ? 'none' : `transform ${FLY_OFF_MS}ms ease-out`,
      }}
    >
      {tint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`pointer-events-none absolute inset-0 z-10 rounded-3xl ${tint.overlay}`}
        >
          <span className={`absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${tint.badge}`}>
            <tint.icon className="w-3.5 h-3.5" strokeWidth={3} /> {tint.label}
          </span>
        </motion.div>
      )}

      {isFlipped && dragX !== 0 && (
        <span
          className={`absolute top-5 z-10 px-3 py-1 rounded-lg border-2 text-sm font-black uppercase tracking-wider rotate-[-8deg] ${
            dragX > 0 ? 'left-5 border-green-500 text-green-600 bg-white' : 'right-5 border-orange-500 text-orange-600 bg-white rotate-[8deg]'
          }`}
          style={{ opacity: swipeStrength }}
        >
          {dragX > 0 ? 'Knew it' : 'Review'}
        </span>
      )}

      {/* Both faces sit in the same grid cell, so the card is as tall as the
          longer of question and answer and nothing is clipped mid-flip. */}
      <div className={`grid transform-3d will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="relative overflow-hidden [grid-area:1/1] backface-hidden min-h-[300px] bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 rounded-3xl shadow-xl shadow-teal-900/25 p-6 md:p-8 flex flex-col">
          {/* A radial gradient rather than a blur filter: blurs stutter mid-flip on low-end phones. */}
          <span className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_70%)]" aria-hidden="true" />
          <span className="absolute -bottom-12 right-4 text-[12rem] font-black leading-none text-white/10 select-none" aria-hidden="true">?</span>
          <div className="relative flex justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-teal-100/80">
            {frontTag}
          </div>
          <p className="relative my-auto py-6 text-xl md:text-2xl font-semibold text-white leading-snug">{card.question}</p>
          <p className="relative text-xs text-teal-100/70">Tap the card or press Space to reveal the learning point</p>
        </div>

        <div className="relative overflow-hidden [grid-area:1/1] backface-hidden rotate-y-180 min-h-[300px] bg-gradient-to-br from-emerald-50 via-white to-sky-50 rounded-3xl border border-emerald-200 shadow-xl shadow-emerald-100/60 p-6 md:p-8 flex flex-col">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" aria-hidden="true" />
          <div className="relative flex justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700/70">
            {backTag}
          </div>
          <div className="relative my-auto py-6">
            <p className="text-lg md:text-xl text-slate-800 leading-relaxed">{card.answer}</p>
            {card.guidelineUpdate && <GuidelineUpdate text={card.guidelineUpdate} />}
          </div>
          <p className="relative text-xs text-slate-400">
            <span className="md:hidden">Swipe right if you knew it, left to review again</span>
            <span className="hidden md:inline">Did you know it? Mark below, or drag the card right or left.</span>
          </p>
        </div>
      </div>
    </div>
    </motion.div>
  );
};
