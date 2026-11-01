import React, { useRef, useState } from 'react';

// How far a revealed card must be dragged before letting go counts as a swipe.
const SWIPE_THRESHOLD_PX = 110;
const FLY_OFF_MS = 220;

export const GuidelineUpdate = ({ text }) => (
  <div className="mt-4 border-l-3 border-amber-500 bg-amber-50 rounded-md px-3 py-2 text-sm text-slate-700 leading-relaxed">
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
export const FlipCard = ({ card, frontTag, backTag, isFlipped, onFlip, onSwipe }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(0);
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
      setExitDirection(direction);
      setTimeout(() => onSwipe(direction > 0 ? 'right' : 'left'), FLY_OFF_MS);
      return;
    }
    setDragX(0);
  };

  const offsetX = exitDirection ? exitDirection * window.innerWidth : dragX;
  const swipeStrength = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD_PX, 1);

  return (
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
      <div className={`grid transform-3d transition-transform duration-500 motion-reduce:transition-none ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="[grid-area:1/1] backface-hidden min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8 flex flex-col">
          <div className="flex justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {frontTag}
          </div>
          <p className="my-auto py-6 text-xl md:text-2xl font-semibold text-slate-900 leading-snug">{card.question}</p>
          <p className="text-xs text-slate-400">Tap the card or press Space to reveal the learning point</p>
        </div>

        <div className="[grid-area:1/1] backface-hidden rotate-y-180 min-h-[300px] bg-white rounded-2xl border border-brand-blue/30 shadow-md p-6 md:p-8 flex flex-col">
          <div className="flex justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {backTag}
          </div>
          <div className="my-auto py-6">
            <p className="text-lg md:text-xl text-slate-800 leading-relaxed">{card.answer}</p>
            {card.guidelineUpdate && <GuidelineUpdate text={card.guidelineUpdate} />}
          </div>
          <p className="text-xs text-slate-400">
            <span className="md:hidden">Swipe right if you knew it, left to review again</span>
            <span className="hidden md:inline">Did you know it? Mark below, or drag the card right or left.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
