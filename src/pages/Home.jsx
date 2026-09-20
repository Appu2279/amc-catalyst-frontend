import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star, BookOpen, FileText, Target,
  ArrowRight, Sparkles, Stethoscope, ListChecks,
  UserPlus, Unlock, QrCode, Clock3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProtectedImage } from '@/components/ProtectedImage';
import { getPublicNoteCovers } from '@/api/noteService';

const HERO_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80';

/**
 * The hero visual: a slideshow of note cover art once there is any (fetched
 * publicly, no sign-in needed — see notes/public/covers on the backend),
 * falling back to the original stock photo when there are none yet. New
 * covers uploaded from the admin Notes page show up here automatically, no
 * code change needed.
 */
const HeroSlideshow = () => {
  const [covers, setCovers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getPublicNoteCovers()
      .then((res) => setCovers(res.data ?? []))
      .catch(() => setCovers([]))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (covers.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % covers.length), 3500);
    return () => clearInterval(timer);
  }, [covers.length]);

  if (loaded && covers.length === 0) {
    return (
      <img
        src={HERO_IMAGE_FALLBACK}
        className="w-full h-[300px] md:h-[400px] object-cover grayscale-[20%]"
        alt="Medical Professional"
      />
    );
  }

  const current = covers[index];

  return (
    <div
      className={`relative w-full h-[360px] md:h-[480px] flex items-center justify-center overflow-hidden
                 bg-gradient-to-br from-violet-50 via-white to-amber-50 ${!loaded ? 'animate-pulse' : ''}`}
    >
      {/* Soft brand-coloured glow, not the cover's own (often much darker)
          colours — keeps this box feeling like the rest of the light page
          instead of a mismatched dark panel dropped into it. */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* A couple of ghost cards behind the current one, hinting there is a
          whole set of notes here rather than a single picture. */}
      {current && (
        <>
          <div className="absolute w-[190px] md:w-[230px] aspect-[2/3] rounded-xl bg-white border border-slate-200 shadow-sm rotate-[9deg] translate-x-8" />
          <div className="absolute w-[190px] md:w-[230px] aspect-[2/3] rounded-xl bg-white border border-slate-200 shadow-sm -rotate-[7deg] -translate-x-8" />
        </>
      )}

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10, rotate: 0, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-[190px] md:w-[230px] rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white"
          >
            <ProtectedImage
              src={`/api/notes/public/${current.id}/cover`}
              alt={current.title}
              className="w-full h-[285px] md:h-[345px] object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-aligned, not centred — the "Topics Covered" badge floats over
          the box's bottom-left corner, so this stays clear of it at every
          width instead of colliding on narrow screens. */}
      {current && (
        <p className="absolute bottom-4 right-4 z-10 max-w-[55%] truncate
                      text-sm font-bold text-slate-600 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          {current.title}
        </p>
      )}

      {covers.length > 1 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {covers.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${c.title}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-brand-violet' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Number Counter Hook
const useCountUp = (start, end, duration = 2) => {
  const [count, setCount] = useState(start);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      const current = Math.floor(progress * (end - start) + start);
      setCount(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [start, end, duration, isInView]);

  return { count, ref };
};

export const Home = () => {
  // Custom hooks for each stat
  const { count: doctorsCount, ref: doctorsRef } = useCountUp(0, 700, 2);
  // Two instances: the hero badge and the stats bar scroll into view at
  // different times, and each only counts up once its own ref is visible.
  const { count: coverageBadge, ref: coverageBadgeRef } = useCountUp(0, 90, 2);
  const { count: coverageStat, ref: coverageStatRef } = useCountUp(0, 90, 2);

  return (
    <div className="bg-white selection:bg-brand-violet/10">
      
      {/* 1. COMPACT HERO */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-brand-violet/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-5">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Now Enrolling</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-brand-dark leading-tight mb-6">
                The Catalyst for <br />
                <span className="text-gradient-brand italic">Medical Mastery.</span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-500 font-medium mb-8 max-w-md">
                High-yield resources and structured learning paths designed by specialist doctors for the AMC exam.
              </p>
              
              <div className="flex flex-wrap items-center gap-5">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-6 rounded-xl bg-brand-dark text-white hover:bg-brand-violet shadow-md">
                    Get Started Free
                  </Button>
                </Link>
                {/* Scrolls to the "how it works" section rather than linking
                    away — a visitor who scrolls fast past that section can
                    still find it from here, since this button never leaves
                    the first screen. */}
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-brand-dark hover:text-brand-violet transition-colors group"
                >
                  <span className="w-9 h-9 rounded-full border-2 border-slate-200 group-hover:border-brand-violet flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </span>
                  See how it works
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg">
                <HeroSlideshow />
              </div>
              <div
                ref={coverageBadgeRef}
                className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-md border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <ListChecks className="w-5 h-5 text-brand-gold" />
                  <div>
                    <p className="text-lg font-black text-brand-dark">{coverageBadge}%</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Topics Covered</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS — added after student feedback that it wasn't obvious
          what to actually do on the site: try something free, or pay. A dark
          band (strong contrast against the white sections above/below is
          what actually catches a fast-scrolling eye, more than any
          animation on its own) with several layered CONTINUOUS animations —
          glow blobs, a ping ring on each icon, and the cards themselves
          floating — all running on their own loop, independent of scroll
          position, so there's motion to catch mid-scroll rather than a
          one-shot entrance effect a fast scroll can outrun. */}
      <section
        id="how-it-works"
        className="relative py-28 lg:py-40 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-hidden scroll-mt-20"
      >
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-brand-violet/30 rounded-full blur-3xl pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-gold/25 rounded-full blur-3xl pointer-events-none"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [1.3, 1, 1.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black uppercase tracking-[0.3em] text-amber-300 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Getting Started
            </span>
            <h3 className="text-4xl md:text-6xl font-black text-white">How AMC Catalyst works.</h3>
            <p className="text-base md:text-lg text-slate-300 font-medium mt-4 max-w-xl mx-auto">
              Three steps from landing here to studying with the full library — no guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                step: '1',
                icon: <UserPlus />,
                title: 'Create a free account',
                desc: 'Sign up with your name, email and a password — under a minute, no credit card, no waiting for approval.',
                cta: { label: 'Sign up free', to: '/register' },
                color: 'brand-violet',
              },
              {
                step: '2',
                icon: <Unlock />,
                title: 'Try the free samples',
                desc: 'Once you’re signed in, Notes, QBank, Recall and Mock Exams each have real sample content marked "Free" — the actual thing, not a separate demo.',
                color: 'brand-blue',
              },
              {
                step: '3',
                icon: <QrCode />,
                title: 'Pay to unlock everything',
                desc: 'Pick a plan, scan the QR code to pay, then submit your payment reference. We verify transfers by hand, so full access usually opens within two working days.',
                cta: { label: 'View plans', to: '/pricing' },
                color: 'brand-gold',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: idx * 0.15, duration: 0.6, type: 'spring', bounce: 0.45 }}
              >
                {/* Separate inner element for the perpetual float — the outer
                    motion.div only ever plays its entrance once, so the loop
                    has to live one level in to run continuously afterward. */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.4 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden"
                >
                  {/* Giant faint numeral, purely decorative weight */}
                  <span className="absolute -top-4 -right-2 text-9xl font-black text-slate-100 select-none pointer-events-none leading-none">
                    {item.step}
                  </span>

                  <div className="relative flex items-center gap-4 mb-5">
                    <div className="relative w-16 h-16 shrink-0">
                      <span className={`absolute inset-0 rounded-2xl bg-${item.color} opacity-60 animate-ping`} />
                      <div className={`relative w-16 h-16 rounded-2xl bg-${item.color} flex items-center justify-center shadow-lg`}>
                        {React.cloneElement(item.icon, { className: 'w-8 h-8 text-white' })}
                      </div>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest text-${item.color}`}>
                      Step {item.step}
                    </span>
                  </div>
                  <h4 className="relative text-xl font-black text-brand-dark mb-2.5">{item.title}</h4>
                  <p className="relative text-sm text-slate-500 font-medium leading-relaxed mb-6">{item.desc}</p>
                  {item.cta && (
                    <Link to={item.cta.to} className="relative mt-auto">
                      <span
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-${item.color} text-white text-sm font-bold shadow-md hover:shadow-lg hover:brightness-110 transition-all`}
                      >
                        {item.cta.label}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-center text-sm text-slate-300 font-medium">
            <Clock3 className="w-4 h-4 shrink-0 text-amber-300" />
            Payments are checked by hand against our bank statement — access usually opens within two working days of your transfer.
          </div>
        </div>
      </section>

      {/* 3. TIGHT STATS BAR */}
      <section className="py-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div ref={doctorsRef}>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">{doctorsCount.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Doctors Trained</p>
            </div>
            {/* No count-up here: the claim is the recency of the recalls, not a volume. */}
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">1 Year</h3>
              <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Of Recall Questions</p>
            </div>
            <div ref={coverageStatRef}>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">{coverageStat}%</h3>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">AMC Syllabus Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPACT BENTO FEATURES */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-violet mb-2">CORE PLATFORM</h2>
             <h3 className="text-3xl font-black text-brand-dark">Everything you need to succeed.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              icon: <BookOpen />, title: "Adaptive QBank (MCQs)", desc: "1 year of recall questions that adapt to your performance.",
              color: "brand-violet", comingSoon: true
            }, {
              icon: <FileText />, title: "22 High-Yield Notes", desc: "Dr. Solosailor’s complete index: Part 1 (10) & Part 2 (12) notes & resources.",
              color: "brand-blue"
            }, {
              icon: <Target />, title: "Mock Exams", desc: "Full simulations replicating real exam pressure.",
              color: "brand-gold"
            }].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 text-${item.color} flex items-center justify-center group-hover:bg-${item.color} group-hover:text-white transition-all`}>
                    {React.cloneElement(item.icon, { className: "w-5 h-5" })}
                  </div>
                  {item.comingSoon && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Coming Soon ⏳
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-black text-brand-dark mb-2 flex items-center gap-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Notes Index Highlight Box */}
          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-900/50">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Dr. Solosailor’s AMC CATALYST
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white">AMC CATALYST NOTES — COMPLETE INDEX</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Comprehensive 22 High-Yield Notes & Resources split into Part 1 (10 Notes) and Part 2 (12 Notes), covering Cardiology, Psychiatry, Ethics, Venom & Bites, Statistics & more.
              </p>
            </div>
            <Link to="/features" className="shrink-0">
              <Button size="lg" className="h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                View 22 Notes Index →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-6">
            Your Future <br />
            <span className="text-gradient-brand">Begins Today.</span>
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Join 12,000+ doctors on the most trusted AMC pathway.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link to="/register">
                <Button size="lg" className="h-12 px-8 rounded-xl bg-brand-dark text-white hover:bg-brand-violet text-sm font-bold shadow-md">
                    Create Free Account
                </Button>
             </Link>
             <Link to="/features">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border border-slate-100 text-brand-dark font-bold hover:bg-slate-50 text-sm">
                    Explore Platform
                </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-slate-50 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
           Excellence &middot; Integrity &middot; Catalyst
        </p>
      </footer>
    </div>
  );
};