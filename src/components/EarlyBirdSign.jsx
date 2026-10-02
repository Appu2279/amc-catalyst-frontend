import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * A wooden "Early Bird ends soon" board hanging from a nail on two strings,
 * gently swinging. Links to pricing. The swing pivots on the nail (transform
 * origin at the top), and stops for visitors who ask for reduced motion.
 */
export const EarlyBirdSign = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`theme-fixed flex flex-col items-center ${className}`}
      style={{ transformOrigin: 'top center' }}
      initial={{ rotate: 0 }}
      animate={shouldReduceMotion ? { rotate: 0 } : { rotate: [-5, 5] }}
      transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
    >
      {/* Nail */}
      <span className="relative z-10 w-3 h-3 rounded-full bg-slate-500 ring-2 ring-slate-300 shadow" />

      {/* Two strings from the nail down to the board's top corners */}
      <svg className="-mt-1.5 w-28 md:w-36 h-9" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 0 L10 30 M50 0 L90 30" stroke="#78716c" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>

      <Link
        to="/pricing"
        className="relative -mt-1 w-32 md:w-40 px-3 py-2.5 rounded-lg text-center shadow-lg
                   border-2 border-amber-900/60 hover:brightness-110 transition-[filter]"
        style={{
          // Wood: a warm base with faint horizontal grain lines.
          backgroundColor: '#b45309',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 7px),' +
            'linear-gradient(180deg, #d97706 0%, #92400e 100%)',
        }}
      >
        {/* Screw heads where the strings attach */}
        <span className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-amber-950/60" />
        <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-amber-950/60" />

        <span className="block text-sm md:text-base font-black tracking-wide text-amber-50 drop-shadow">
          EARLY BIRD
        </span>
        <span className="block text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-amber-100/90">
          ends soon
        </span>
      </Link>
    </motion.div>
  );
};
