import React, { useState, useEffect, useRef } from 'react';
import {
  motion, AnimatePresence, useInView, useMotionValue, useMotionTemplate, useReducedMotion,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Stethoscope, CheckCircle2, Sparkles, Users, CalendarCheck, ListChecks } from 'lucide-react';
import { EarlyBirdSign } from '@/components/EarlyBirdSign';
import { FreeMockAnnouncement } from '@/components/FreeMockAnnouncement';
import { HeroVisual, useHeroPlayback } from '@/components/home/HeroVisual';
import { SubjectMarquee } from '@/components/home/SubjectMarquee';
import { FeatureBento } from '@/components/home/FeatureBento';
import { JourneyTimeline } from '@/components/home/JourneyTimeline';
import { Testimonials } from '@/components/home/Testimonials';

// Counts up from 0 to `end` once the element scrolls into view. Visitors who
// ask for reduced motion get the final number straight away.
const useCountUp = (end, duration = 2) => {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      setCount(end);
      return;
    }
    let startTime;
    let frame;
    const step = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / (duration * 1000), 1);
      // ease-out so the number decelerates into place
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, isInView, reduce]);

  return { count, ref };
};

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';

// Primary CTA with a light sweep running across it — the one element on the
// page that's always gently moving, so the eye keeps returning to it.
const ShimmerCta = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl overflow-hidden
                bg-gradient-to-r from-brand-violet to-brand-blue text-white text-base font-bold
                shadow-[0_10px_40px_-10px_rgba(124,58,237,0.8)] hover:shadow-[0_14px_50px_-8px_rgba(124,58,237,0.95)]
                hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-all duration-200 cursor-pointer ${FOCUS_RING} ${className}`}
  >
    <span
      aria-hidden="true"
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent motion-reduce:animate-none"
    />
    <span className="relative flex items-center gap-2">{children}</span>
  </Link>
);

// One per hero demo mode (Recall, QBank, Mock exam), in the same order.
const ROTATING_WORDS = ['with recalls.', 'with QBank.', 'with mocks.'];

// The last line of the headline follows whichever demo the hero card is
// playing. Screen readers get the static sentence in the h1 instead.
const RotatingWord = ({ index }) => {
  return (
    <span className="relative block h-[1.15em] overflow-hidden" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={ROTATING_WORDS[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 bg-gradient-to-r from-amber-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent whitespace-nowrap"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Headline words rise in one after another (kept to a short line, per the
// motion guidance — never split-animate body copy).
const RevealWords = ({ text, delay = 0 }) => {
  const reduce = useReducedMotion();
  return text.split(' ').map((word, i) => (
    <span key={i} className="inline-block overflow-hidden align-bottom pb-1 -mb-1">
      <motion.span
        className="inline-block"
        initial={reduce ? false : { y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.6, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {word}&nbsp;
      </motion.span>
    </span>
  ));
};

const Hero = () => {
  const reduce = useReducedMotion();
  // Pointer position over the hero, -0.5…0.5, shared by the spotlight and
  // the 3D tilt of the product collage.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useMotionValue(-1000);
  const py = useMotionValue(-1000);
  const playback = useHeroPlayback();
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${px}px ${py}px, rgba(139,92,246,0.18), transparent 60%)`;

  const onMove = (e) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set(e.clientX - rect.left);
    py.set(e.clientY - rect.top);
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="theme-fixed relative overflow-hidden bg-slate-950 pt-28 pb-20 lg:pt-36 lg:pb-28"
    >
      {/* Aurora: three slow-drifting colour blobs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-20 w-[36rem] h-[36rem] rounded-full bg-brand-violet/40 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 80, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-brand-blue/30 blur-[120px]"
          animate={reduce ? undefined : { x: [0, -60, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full bg-brand-gold/25 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Fine grid, faded out toward the edges */}
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>
      {/* Cursor spotlight */}
      <motion.div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: spotlight }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur mb-7 text-xs font-bold uppercase tracking-[0.15em] text-slate-200"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            AMC Part 1<span className="hidden sm:inline"> · Now enrolling</span>
          </motion.p>

          <h1 className="text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-[3.6rem] xl:text-[4.25rem] font-black tracking-tight text-white mb-7">
            <span className="sr-only">Pass the AMC with recalls, QBank and mock exams.</span>
            <span aria-hidden="true">
              <RevealWords text="Pass the AMC" />
            </span>
            <RotatingWord index={playback.mode} />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-lg md:text-xl text-slate-300 leading-relaxed mb-9 max-w-xl"
          >
            A year of real recall questions, full mock exams and 22 high-yield notes —
            built by specialist doctors for international medical graduates sitting AMC Part 1.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 mb-9"
          >
            <ShimmerCta to="/register">
              Start free today <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </ShimmerCta>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl border border-white/20 bg-white/5 backdrop-blur text-white text-base font-bold hover:bg-white/10 transition-colors duration-200 cursor-pointer ${FOCUS_RING}`}
            >
              See how it works <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </a>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300"
          >
            {['Free to sign up', 'No credit card', 'Free samples in every section'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative">
          <EarlyBirdSign className="absolute -top-14 right-2 z-30" />
          <HeroVisual mx={mx} my={my} playback={playback} />
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  const doctors = useCountUp(700);
  const coverage = useCountUp(90);
  const months = useCountUp(12, 1.4);

  const items = [
    { ref: doctors.ref, value: `${doctors.count}+`, label: 'Doctors trained', icon: Users },
    { ref: months.ref, value: `${months.count} months`, label: 'Of recall questions', icon: CalendarCheck },
    { ref: coverage.ref, value: `${coverage.count}%`, label: 'AMC syllabus covered', icon: ListChecks },
  ];

  return (
    <section aria-label="AMC Catalyst in numbers" className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {items.map(({ ref, value, label, icon: Icon }, i) => (
          <motion.div
            key={label}
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"
          >
            <Icon className="mx-auto mb-3 w-6 h-6 text-brand-violet" aria-hidden="true" />
            <p className="text-4xl md:text-5xl font-black tracking-tight text-gradient-brand tabular-nums">{value}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const FinalCta = () => {
  const reduce = useReducedMotion();
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="theme-fixed relative max-w-6xl mx-auto overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 md:py-24 text-center"
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand-violet/50 blur-[100px]"
            animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-brand-gold/30 blur-[100px]"
            animate={reduce ? undefined : { scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative">
          <Sparkles className="mx-auto mb-5 w-8 h-8 text-amber-300" aria-hidden="true" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white text-balance">
            Your AMC journey starts today.
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-xl mx-auto">
            Join 700+ doctors preparing with AMC Catalyst. Start free — upgrade only when you’re ready.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <ShimmerCta to="/register">
              Create free account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </ShimmerCta>
            <Link
              to="/pricing"
              className={`inline-flex items-center justify-center h-14 px-7 rounded-2xl border border-white/20 bg-white/5 text-white text-base font-bold hover:bg-white/10 transition-colors duration-200 ${FOCUS_RING}`}
            >
              View plans & pricing
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export const Home = () => (
  <div className="bg-white selection:bg-brand-violet/20">
    <Hero />
    <SubjectMarquee />
    <Stats />
    {/* Free international AMC 1 mock (October) — time-sensitive, so it sits
        high on the page. */}
    <FreeMockAnnouncement />
    <FeatureBento />
    <JourneyTimeline />
    <Testimonials />
    <FinalCta />
  </div>
);
