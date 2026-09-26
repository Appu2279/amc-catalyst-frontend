import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, BarChart3, Target, Users, CalendarDays, Globe2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PROMISES = [
  { icon: FileText, title: 'Real AMC 1 exam style', body: 'High-yield, exam-oriented MCQs.' },
  { icon: BarChart3, title: 'Check your readiness', body: 'Find out how ready you are for the real exam.' },
  { icon: Target, title: 'Find your mistakes', body: 'Detailed performance analysis.' },
  { icon: Users, title: 'Live discussion session', body: 'The mock test discussed with explanations.' },
];

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];
const EXAM_SECONDS = 3.5 * 60 * 60;

const formatClock = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/**
 * A laptop showing the exam screen students will actually sit on this site —
 * so the announcement reads as "this happens here", not an ad for elsewhere.
 * The timer runs and an answer gets picked on a loop; both hold still for
 * reduced-motion visitors.
 */
const MockExamLaptop = () => {
  const shouldReduceMotion = useReducedMotion();
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const clock = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : EXAM_SECONDS)), 1000);
    // Cycle: nothing picked, then B, then change of mind to D.
    const picks = [null, 1, 3];
    let step = 0;
    const picker = setInterval(() => {
      step = (step + 1) % picks.length;
      setSelectedOption(picks[step]);
    }, 1600);
    return () => { clearInterval(clock); clearInterval(picker); };
  }, [shouldReduceMotion]);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Screen */}
      <div className="rounded-t-2xl border-[10px] border-b-[14px] border-slate-800 bg-slate-800 shadow-2xl">
        <div className="rounded-md bg-white p-4 md:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-brand-dark">AMC 1 Mock Test</p>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
              {formatClock(secondsLeft)}
            </span>
          </div>
          <p className="mt-3 text-[11px] font-bold text-slate-400">Question 1 of 150</p>
          <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2.5">
            <span className="block h-2 w-11/12 rounded bg-slate-300" />
            <span className="block h-2 w-3/4 rounded bg-slate-300" />
          </div>
          <ul className="mt-3 space-y-1.5">
            {OPTION_KEYS.map((key, i) => {
              const isSelected = selectedOption === i;
              return (
                <li
                  key={key}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors duration-300 ${
                    isSelected ? 'border-brand-violet bg-brand-violet/10' : 'border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-black ${isSelected ? 'text-brand-violet' : 'text-slate-400'}`}>{key}</span>
                  <span className={`h-1.5 rounded ${isSelected ? 'bg-brand-violet/50' : 'bg-slate-200'}`} style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-md border border-slate-300 px-3 py-1 text-[10px] font-bold text-slate-500">Previous</span>
            <span className="rounded-md bg-brand-violet px-4 py-1 text-[10px] font-bold text-white">Next</span>
          </div>
        </div>
      </div>
      {/* Base */}
      <div className="mx-auto h-3 w-[112%] -translate-x-[5.5%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-lg" />

      {/* Floating badge — the date already has its own strip beside this */}
      <motion.div
        className="absolute -top-5 -right-3 md:-right-8 flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 shadow-lg"
        animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="h-5 w-5 text-brand-gold" />
        <div className="leading-tight">
          <p className="text-sm font-black text-brand-dark">100% Free</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Just log in</p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Homepage announcement for the free international AMC 1 mock test, adapted
 * from the client's poster into the site's own style.
 */
export const FreeMockAnnouncement = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section
      id="free-mock"
      className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-br from-amber-50 via-white to-violet-50 scroll-mt-20"
    >
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-violet/15 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-violet">
              Free for all AMC 1 aspirants
            </p>

            <h2 className="mt-4 font-black leading-[0.95] text-brand-dark">
              <span className="flex flex-wrap items-center gap-3">
                <span className="text-5xl md:text-7xl text-brand-violet">FREE</span>
                <span className="rounded-lg bg-brand-violet/10 px-3 py-1 text-sm md:text-lg font-black uppercase tracking-widest text-brand-violet">
                  International
                </span>
              </span>
              <span className="mt-2 block text-4xl md:text-6xl">Real AMC 1</span>
              <span className="block text-4xl md:text-6xl text-gradient-brand">Mock Test</span>
            </h2>

            <p className="mt-6 max-w-md text-base md:text-lg font-semibold text-slate-600">
              Test your preparation. Find your mistakes. Come back stronger.
            </p>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              You&apos;ll sit it right here on AMC Catalyst — free, and open to everyone worldwide.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PROMISES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-brand-violet shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-brand-dark">{title}</p>
                    <p className="text-xs font-medium text-slate-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white/80 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-8 w-8 text-brand-gold" />
                <div className="leading-tight">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming this</p>
                  <p className="text-2xl font-black text-brand-gold">OCTOBER</p>
                </div>
              </div>
              <span className="hidden h-10 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Globe2 className="h-5 w-5 text-brand-violet" /> Open to everyone worldwide
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/mock-exam"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-black text-white shadow-md hover:bg-brand-violet"
                  >
                    Go to Mock Exams <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-xs font-medium text-slate-500">You&apos;re signed in — it will appear there in October.</p>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-black text-white shadow-md hover:bg-brand-violet"
                  >
                    Create your free account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-xs font-medium text-slate-500">
                    Then log in to take the free mock.{' '}
                    <Link to="/login" className="font-bold text-brand-violet hover:underline">Log in</Link>
                  </p>
                </>
              )}
            </div>
            <p className="mt-3 text-[10px] font-medium text-slate-400">
              <Link to="/terms" className="hover:underline">Terms and conditions apply.</Link>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="px-4"
          >
            <MockExamLaptop />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
