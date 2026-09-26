import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Pointed-top tag outline, the classic shop price tag.
const TAG_SHAPE = 'polygon(50% 0, 100% 22%, 100% 100%, 0 100%, 0 22%)';

/**
 * A paper price tag reading "Early Bird — ends soon", hanging from a single
 * string and drifting as if in a breeze (a slow sway plus a slight turn).
 * Deliberately a different object and motion from the homepage's wooden
 * EarlyBirdSign. Decorative only; motion stops for reduced-motion visitors.
 */
export const EarlyBirdTag = ({ stringHeight = 40, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex-col items-center [perspective:600px] ${className}`} aria-label="Early Bird offer ends soon">
      <motion.div
        className="flex flex-col items-center"
        style={{ transformOrigin: 'top center' }}
        animate={shouldReduceMotion ? {} : { rotate: [0, 7, -5, 3, -2, 0], rotateY: [0, 22, 0, -22, 0, 0] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      >
        <span className="w-px bg-slate-400" style={{ height: stringHeight }} />

        <div className="relative -mt-1 w-24 md:w-28 drop-shadow-lg">
          <div
            className="flex flex-col items-center pt-7 pb-3 px-2 text-center bg-gradient-to-b from-brand-violet to-violet-800"
            style={{ clipPath: TAG_SHAPE }}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-gold">Offer</span>
            <span className="mt-0.5 text-sm md:text-base font-black leading-none text-white">EARLY<br />BIRD</span>
            <span className="mt-1.5 w-10 border-t border-dashed border-white/40" />
            <span className="mt-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-violet-100">Ends soon</span>
          </div>

          {/* Eyelet the string threads through */}
          <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white ring-2 ring-brand-gold" />
        </div>
      </motion.div>
    </div>
  );
};
