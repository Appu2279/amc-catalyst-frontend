import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  FileText, Lightbulb, Image, CalendarClock, RefreshCw, ListChecks, BookOpen, ClipboardCheck,
  Send, MessageCircle, CalendarDays, ArrowRight, Mail, Users, Sparkles,
} from 'lucide-react';
import { Glow, GLOW } from '@/components/ui/Glow';
import { SydneyHarbour, FlyingPlane } from '@/components/home/SydneyHarbour';

// Early-bird deadline and first discussion class: 15 October, end of day in
// India (prices are in ₹). The whole section hides itself once this passes,
// so the homepage never shows a stale offer.
const DEADLINE = new Date('2026-10-15T23:59:59+05:30');
const CONTACT_EMAIL = 'dr.solosailor@gmail.com';

const INCLUDED = [
  { icon: FileText, label: 'Complete AMC Catalyst Notes (all subjects)' },
  { icon: Lightbulb, label: 'High-yield one-liners' },
  { icon: Image, label: 'Image-based learning' },
  { icon: CalendarClock, label: '10 months of recalls' },
  { icon: RefreshCw, label: 'Monthly recall updates + next 5 months’ updates' },
  { icon: ListChecks, label: '2500+ structured MCQs' },
  { icon: BookOpen, label: 'Subject-wise QBank' },
  { icon: ClipboardCheck, label: '3–5 mock exams' },
  { icon: Send, label: 'Telegram community' },
  { icon: MessageCircle, label: 'Question discussion' },
  { icon: CalendarDays, label: 'Weekly discussion sessions (from October)' },
];

const timeLeft = () => Math.max(0, DEADLINE.getTime() - Date.now());

const split = (ms) => {
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
};

// Ticks once a second, only while the section is on screen.
const useCountdown = (active) => {
  const [ms, setMs] = useState(timeLeft);
  useEffect(() => {
    if (!active) return;
    setMs(timeLeft());
    const id = setInterval(() => setMs(timeLeft()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return ms;
};

const ClosingSoonSticker = () => (
  <div className="animate-wiggle motion-reduce:animate-none origin-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-900 px-5 py-3 text-center shadow-xl ring-2 ring-white/20 -rotate-6">
    <p className="text-sm font-black uppercase leading-tight text-white">Early bird offer</p>
    <p className="text-lg font-black uppercase leading-tight text-amber-300">Closing soon!</p>
  </div>
);

const CountdownUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="relative w-14 sm:w-16 overflow-hidden rounded-xl bg-white text-center shadow-lg">
      {/* Each change slides the new number in (fades for reduced motion) */}
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="block py-2 text-2xl sm:text-3xl font-black tabular-nums text-violet-900"
      >
        {String(value).padStart(2, '0')}
      </motion.span>
    </span>
    <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-100/80">{label}</span>
  </div>
);

/**
 * Homepage announcement for the first batch: the 15 October discussion class,
 * the early-bird deadline (with a live countdown) and everything included.
 * No prices here on purpose — "Enroll now" goes to /pricing, where they are.
 *
 * Built to catch the eye — a vivid purple panel between light sections, a
 * self-drawing swoosh under FIRST BATCH, a wiggling "closing soon" sticker
 * and chips that pop in — using CSS/compositor-friendly motion, paused
 * off-screen. Dark in both themes (.theme-fixed).
 */
export const FirstBatchAnnouncement = () => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.1 });
  const ms = useCountdown(inView);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.6 });
  const drawn = reduce || headingInView;

  if (ms <= 0) return null;
  const { days, hours, minutes, seconds } = split(ms);

  return (
    <section ref={ref} aria-labelledby="first-batch-heading" className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="theme-fixed relative max-w-7xl mx-auto overflow-hidden rounded-[2.5rem] bg-[linear-gradient(180deg,#120a2e_0%,#2a1458_38%,#5b1f6e_66%,#a3335c_84%,#e8743b_100%)] px-5 pt-10 pb-32 sm:px-10 sm:pt-14 sm:pb-56 lg:px-14 lg:pb-64 shadow-2xl shadow-violet-900/30"
      >
        {/* Dusk over Sydney Harbour, like the poster: a few stars, a plane
            heading for Australia, the setting sun's glow and the skyline. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 opacity-70 [background-image:radial-gradient(1.5px_1.5px_at_12%_18%,white,transparent),radial-gradient(1px_1px_at_28%_9%,white,transparent),radial-gradient(1.5px_1.5px_at_46%_22%,white,transparent),radial-gradient(1px_1px_at_63%_12%,white,transparent),radial-gradient(1.5px_1.5px_at_78%_26%,white,transparent),radial-gradient(1px_1px_at_90%_8%,white,transparent),radial-gradient(1px_1px_at_36%_34%,white,transparent),radial-gradient(1px_1px_at_70%_40%,white,transparent)]" />
        <FlyingPlane className="absolute left-0 right-0 top-[18%]" />
        <Glow className="-bottom-40 left-1/2 -translate-x-1/2 w-[46rem] h-[30rem]" color="rgba(251, 146, 60, 0.45)" />
        {/* Faded like a memory: see-through, softly blurred, and dissolving
            into the sky at the top and edges. Static, so the blur costs one
            paint, not one per frame. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 opacity-45 blur-[1.5px] [mask-image:radial-gradient(120%_100%_at_50%_100%,black_45%,transparent_90%)]"
        >
          <SydneyHarbour className="block w-full h-32 sm:h-52 lg:h-64" />
        </div>

        {/* Sticker */}
        <div className="relative lg:absolute lg:right-10 lg:top-10 mb-6 lg:mb-0 flex justify-end lg:block z-10">
          <ClosingSoonSticker />
        </div>

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-amber-300 ring-1 ring-white/20">
            <Sparkles className="w-4 h-4" aria-hidden="true" /> Now enrolling
          </p>

          <h2 ref={headingRef} id="first-batch-heading" className="mt-5">
            <span className="block text-lg sm:text-2xl font-black uppercase tracking-wide text-violet-100">
              We are starting our
            </span>
            <span className="relative inline-block mt-1">
              <span className="block whitespace-nowrap text-[2.25rem] min-[360px]:text-[2.6rem] min-[400px]:text-5xl sm:text-7xl lg:text-8xl font-black italic tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
                FIRST BATCH
              </span>
              {/* Brush-stroke swoosh that draws itself */}
              <svg aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" className="absolute -bottom-3 left-0 w-full h-4 sm:h-5">
                <motion.path
                  d="M4 16 C 90 4, 190 4, 260 10 S 370 20, 396 8"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: 'easeInOut', opacity: { duration: 0.1, delay: 0.3 } }}
                />
              </svg>
            </span>
          </h2>
          <p className="mt-6 text-sm sm:text-base font-bold uppercase tracking-[0.3em] text-violet-100/80">
            Your AMC journey starts now!
          </p>

          {/* Date + countdown */}
          <div className="mt-8 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-stretch">
            <div className="relative flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-xl">
              <div className="flex w-16 flex-col overflow-hidden rounded-xl text-center ring-1 ring-violet-200">
                <span className="bg-violet-700 py-1 text-[11px] font-black uppercase tracking-wider text-white">Oct</span>
                <span className="py-1.5 text-3xl font-black leading-none text-violet-900">15</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Discussion class</p>
                <p className="text-2xl font-black text-slate-900">15th October</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
              <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6">
                <div className="flex items-start gap-2 sm:gap-3" role="timer" aria-label={`Early bird offer ends in ${days} days, ${hours} hours and ${minutes} minutes`}>
                  <CountdownUnit value={days} label="Days" />
                  <span className="pt-2 text-2xl font-black text-white/60" aria-hidden="true">:</span>
                  <CountdownUnit value={hours} label="Hrs" />
                  <span className="pt-2 text-2xl font-black text-white/60" aria-hidden="true">:</span>
                  <CountdownUnit value={minutes} label="Min" />
                  <span className="pt-2 text-2xl font-black text-white/60" aria-hidden="true">:</span>
                  <CountdownUnit value={seconds} label="Sec" />
                </div>
                <p className="text-sm sm:text-base font-semibold leading-snug text-white">
                  <span className="text-amber-300 font-black">Lock in now</span> — before 15th October.
                  After that, the standard price activates.
                </p>
              </div>
            </div>
          </div>

          {/* Everything included */}
          <p className="mt-10 mb-4 text-xs font-black uppercase tracking-[0.25em] text-violet-100/80">What you get</p>
          <motion.ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.15 }}
            variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
          >
            {INCLUDED.map(({ icon: Icon, label }) => (
              <motion.li
                key={label}
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 },
                  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
                }}
                className="flex items-center gap-3 rounded-xl bg-white/95 px-3.5 py-3 shadow-md"
              >
                <span className="w-9 h-9 shrink-0 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-snug text-slate-800">{label}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              to="/pricing"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl overflow-hidden bg-white text-violet-800 text-base font-black shadow-xl hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-violet-200/60 to-transparent motion-reduce:animate-none" />
              <span className="relative flex items-center gap-2">
                Enroll now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </span>
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('First batch enquiry')}`}
              className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl border border-white/30 bg-white/10 text-white text-base font-bold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <Mail className="w-4 h-4" aria-hidden="true" /> Questions? Email us
            </a>
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300 sm:ml-2">
              <Users className="w-4 h-4" aria-hidden="true" /> Limited seats
            </span>
          </div>

          <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-t border-white/15 pt-6">
            <p className="text-lg sm:text-xl italic font-semibold text-white/90">
              “More than a course — a community that walks with you till you succeed.”
            </p>
            <p className="text-xs text-violet-100/70">
              *Early bird offer valid till 15th October. Then the standard price activates.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
