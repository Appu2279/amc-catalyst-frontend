import React, { useEffect, useRef } from 'react';

const CONFETTI_COLOURS = ['#7c3aed', '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#06b6d4'];
const CONFETTI_PIECES = 70;
const VISIBLE_MS = 2600;

/**
 * A short burst of confetti and a message — for a daily goal reached or a
 * topic mastered. Skips the confetti for students who prefer reduced motion.
 * Calls onDone when it has finished, so the parent can clear it.
 */
export const Celebration = ({ message, onDone }) => {
  const confettiRef = useRef(null);

  useEffect(() => {
    const container = confettiRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (container && !prefersReducedMotion) {
      for (let i = 0; i < CONFETTI_PIECES; i++) {
        const piece = document.createElement('span');
        piece.style.cssText = `position:absolute;left:50%;top:30%;width:8px;height:12px;border-radius:2px;background:${CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]}`;
        container.appendChild(piece);
        const angle = Math.random() * Math.PI * 2;
        const distance = 140 + Math.random() * 260;
        piece.animate(
          [
            { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 260}px) rotate(${Math.random() * 720}deg)`,
              opacity: 0,
            },
          ],
          { duration: 1400 + Math.random() * 800, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }
        );
      }
    }

    const timer = setTimeout(onDone, VISIBLE_MS);
    return () => {
      clearTimeout(timer);
      if (container) container.replaceChildren();
    };
    // Runs once per celebration; the parent remounts it with a new key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none" role="status" aria-live="polite">
      <div ref={confettiRef} className="absolute inset-0 overflow-hidden" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-2xl text-center w-max max-w-[90vw]">
        {message}
      </div>
    </div>
  );
};
