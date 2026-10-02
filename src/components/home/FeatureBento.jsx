import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ClipboardList, FileText, Target, BookOpen, ArrowRight, Users,
  ChevronLeft, ChevronRight, Pause, Play,
} from 'lucide-react';
import { ProtectedImage } from '@/components/ProtectedImage';
import { getPublicNoteCovers } from '@/api/noteService';

/**
 * Card with a soft glow that follows the pointer. The pointer position is
 * written to CSS variables rather than React state, so moving the mouse
 * doesn't re-render anything.
 */
const SpotlightCard = ({ className = '', children }) => {
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };
  return (
    <motion.div
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm
                  hover:shadow-xl hover:-translate-y-1 motion-reduce:hover:translate-y-0 transition-[box-shadow,transform] duration-300 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(420px circle at var(--x) var(--y), rgba(124,58,237,0.12), transparent 45%)' }}
      />
      <div className="relative h-full flex flex-col">{children}</div>
    </motion.div>
  );
};

const TileHeader = ({ icon: Icon, iconClass, title, desc, badge }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconClass}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>
      {badge}
    </div>
    <h3 className="text-xl md:text-2xl font-black tracking-tight text-brand-dark">{title}</h3>
    <p className="mt-2 text-base text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

// ── Recall: a deck of question cards that keeps shuffling forward ──────────
const RECALL_SAMPLES = [
  { subject: 'Obstetrics', q: 'Painless vaginal bleeding at 34 weeks — next step?' },
  { subject: 'Psychiatry', q: 'First-line treatment for moderate depression in a 16-year-old?' },
  { subject: 'Paediatrics', q: 'Barking cough and stridor in a 2-year-old — likely diagnosis?' },
  { subject: 'Ethics', q: 'A 15-year-old requests contraception without parental consent…' },
];

const RecallDeck = () => {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Shuffles for reduced-motion visitors too, but as a fade: cards snap to
  // their place in the stack instead of sliding there.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % RECALL_SAMPLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mt-auto h-80 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-blue-50 border border-slate-100 p-5 sm:p-8" aria-hidden="true">
      <span className="absolute right-5 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" /> Updated monthly
      </span>
      <div className="relative mt-8 h-full">
      <AnimatePresence initial={false}>
        {[0, 1, 2].map((depth) => {
          const item = RECALL_SAMPLES[(index + depth) % RECALL_SAMPLES.length];
          return (
            <motion.div
              key={item.q}
              initial={reduce ? { opacity: 0, y: depth * 16, scale: 1 - depth * 0.05 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1 - depth * 0.3, y: depth * 16, scale: 1 - depth * 0.05, zIndex: 3 - depth }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -30, scale: 1.02 }}
              transition={reduce
                ? { duration: 0.4, y: { duration: 0 }, scale: { duration: 0 } }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-brand-violet">{item.subject}</span>
              <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.q}</p>
              <div className="mt-3 space-y-1.5">
                {[88, 72, 80, 64].map((w, i) => (
                  <div key={w} className="flex items-center gap-2">
                    <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-center">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="h-2 rounded-full bg-slate-100" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>
    </div>
  );
};

// ── Notes: every note's cover, one at a time ───────────────────────────────
// Covers come live from the admin Notes page (notes/public/covers — id + title
// only, in the admin's sort order), so a new cover shows up here with no code
// change. Until the request returns, or if it fails, branded placeholder
// cards stand in so the tile is never empty.
const PLACEHOLDER_NOTES = [
  'Cardiology Notes', 'Psychiatry Notes', 'Obstetrics Notes', 'Ethics Notes', 'Paediatrics Notes',
].map((title) => ({ id: title, title, placeholder: true }));

// Front card plus the next two fanned out behind it.
const DECK = [
  { rotate: 0, x: 0, y: 0, scale: 1, opacity: 1 },
  { rotate: 6, x: 34, y: 6, scale: 0.92, opacity: 0.9 },
  { rotate: 12, x: 64, y: 14, scale: 0.84, opacity: 0.7 },
];

const AUTO_ADVANCE_MS = 3000;

const NoteCover = ({ note }) => (
  <>
    {/* Branded card underneath, so a cover that is still loading — or fails
        to — shows the note's name instead of a blank tile. */}
    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-violet p-4 flex flex-col justify-between">
      <FileText className="w-6 h-6 text-white/80" />
      <span className="text-base font-black leading-tight text-white">{note.title}</span>
    </div>
    {!note.placeholder && (
      <ProtectedImage src={`/api/notes/public/${note.id}/cover`} alt="" className="relative w-full h-full object-cover" />
    )}
  </>
);

const NotesShowcase = () => {
  const reduce = useReducedMotion();
  const [notes, setNotes] = useState(PLACEHOLDER_NOTES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);   // pause button
  const [held, setHeld] = useState(false);       // hover / keyboard focus inside

  useEffect(() => {
    getPublicNoteCovers()
      .then((res) => {
        if (res.data?.length) {
          setNotes(res.data);
          setIndex(0);
        }
      })
      .catch(() => {});
  }, []);

  const count = notes.length;
  const playing = !reduce && !paused && !held && count > 1;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing, count]);

  const go = (delta) => setIndex((i) => (i + delta + count) % count);
  const current = notes[index];
  const deck = DECK.slice(0, Math.min(count, DECK.length)).map((pos, depth) => ({
    note: notes[(index + depth) % count],
    pos,
    depth,
  }));

  const controlClass =
    'w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:border-brand-blue hover:text-brand-blue transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet';

  return (
    <div
      className="grid sm:grid-cols-[1fr_auto] gap-8 h-full"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false); }}
      role="region"
      aria-roledescription="carousel"
      aria-label="AMC Catalyst notes"
    >
      <div className="flex flex-col">
        <TileHeader
          icon={FileText}
          iconClass="bg-brand-blue/10 text-brand-blue"
          title="22 high-yield notes"
          desc="Dr. Solosailor’s complete index — Part 1 (10) and Part 2 (12)."
        />

        <div className="mt-auto">
          {/* Caption for the front cover; announced politely as it changes
              when the visitor is driving it, silent while it auto-plays. */}
          <div className="min-h-[3.5rem]" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="sr-only">Note </span>{index + 1} of {count}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={current.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-1 text-lg font-black text-brand-dark line-clamp-2"
              >
                {current.title}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar refills for each note while auto-playing */}
          <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
            <motion.div
              key={`${index}-${playing}`}
              className="h-full bg-brand-blue"
              initial={{ width: playing ? '0%' : `${((index + 1) / count) * 100}%` }}
              animate={{ width: playing ? '100%' : `${((index + 1) / count) * 100}%` }}
              transition={playing ? { duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' } : { duration: 0.3 }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={() => go(-1)} className={controlClass} aria-label="Previous note">
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} className={controlClass} aria-label="Next note">
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
            {!reduce && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className={controlClass}
                aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              >
                {paused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The deck. Cards are keyed by note, so on each advance the card
          behind slides forward instead of every image re-mounting. */}
      <div className="relative mx-auto w-[150px] h-[210px] sm:mr-16 self-center" aria-hidden="true">
        <AnimatePresence initial={false}>
          {deck.map(({ note, pos, depth }) => (
            <motion.div
              key={note.id}
              initial={reduce ? false : { opacity: 0, x: 90, y: 20, rotate: 18, scale: 0.8 }}
              animate={pos}
              exit={reduce ? undefined : { opacity: 0, x: -90, rotate: -12, scale: 0.95 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: DECK.length - depth }}
              className="absolute inset-0 rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5"
            >
              <NoteCover note={note} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Mock exams: a countdown ring ticking down ──────────────────────────────
const MockTimer = () => {
  const reduce = useReducedMotion();
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mt-auto mx-auto w-32 h-32" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-slate-100" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          className="stroke-brand-gold"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * 0.3 : 0 }}
          animate={reduce ? undefined : { strokeDashoffset: [0, c * 0.95] }}
          transition={reduce ? { duration: 0 } : { duration: 12, ease: 'linear', repeat: Infinity }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-brand-dark tabular-nums">3:30</span>
        <span className="text-xs font-medium text-slate-500">hours</span>
      </div>
    </div>
  );
};

// ── QBank: per-subject progress bars filling in (illustrative) ─────────────
const QBANK_SUBJECTS = [
  { name: 'Medicine', pct: 72 },
  { name: 'Surgery', pct: 48 },
  { name: 'Paediatrics', pct: 61 },
];

const QBankProgress = () => {
  const reduce = useReducedMotion();
  return (
    <div className="mt-auto space-y-3" aria-hidden="true">
      {QBANK_SUBJECTS.map(({ name, pct }, i) => (
        <div key={name}>
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>{name}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-brand-violet"
              initial={{ width: reduce ? `${pct}%` : '0%' }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.15 * i, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FeatureBento = () => (
  <section className="py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mb-12"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-brand-violet">Core platform</p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark text-balance">
          One place for everything the AMC throws at you.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:auto-rows-[minmax(300px,auto)]">
        <SpotlightCard className="lg:col-span-2 lg:row-span-2">
          <TileHeader
            icon={ClipboardList}
            iconClass="bg-brand-violet/10 text-brand-violet"
            title="A year of recall questions"
            desc="Real recalled AMC questions with full explanations, topped up every month so you practise what’s actually being asked."
          />
          <RecallDeck />
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-2">
          <NotesShowcase />
        </SpotlightCard>

        <SpotlightCard>
          <TileHeader
            icon={Target}
            iconClass="bg-brand-gold/10 text-brand-gold"
            title="Mock exams"
            desc="Full-length, timed, real exam pressure."
          />
          <MockTimer />
        </SpotlightCard>

        <SpotlightCard>
          <TileHeader
            icon={BookOpen}
            iconClass="bg-brand-violet/10 text-brand-violet"
            title="Adaptive QBank"
            desc="Subject-wise MCQs that adapt to you."
            badge={
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" /> Live
              </span>
            }
          />
          <QBankProgress />
        </SpotlightCard>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6"
      >
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-violet" aria-hidden="true" />
          </span>
          <p className="text-base text-slate-700">
            <strong className="text-brand-dark">You’re not studying alone.</strong> Join the Telegram community for discussions and expert guidance.
          </p>
        </div>
        <Link
          to="/features"
          className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-brand-violet hover:gap-3 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet rounded"
        >
          Explore all features <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  </section>
);
