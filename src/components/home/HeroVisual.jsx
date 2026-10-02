import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import {
  CheckCircle2, XCircle, Timer, BookOpen, Lightbulb, Bookmark, RotateCcw, Save, ClipboardList, Target,
} from 'lucide-react';

/*
 * The hero "plays" each way of practising on the platform in turn —
 * Recall, QBank, then a Mock exam — as a looping demo on one card. The
 * questions are illustrative samples, not taken from the question bank.
 * Each mode is a short sequence of steps (one every STEP_MS); when a mode's
 * sequence ends the card moves on to the next mode. Visitors can also pick a
 * mode with the tabs. Reduced-motion visitors get each mode's finished state
 * and no auto-cycling.
 */

const STEP_MS = 900;

export const MODES = [
  { id: 'recall', label: 'Recall', icon: ClipboardList, steps: 9 },
  { id: 'qbank', label: 'QBank', icon: BookOpen, steps: 10 },
  { id: 'mock', label: 'Mock exam', icon: Target, steps: 10 },
];
// The step each mode shows when it isn't animating (its "finished" frame).
const STILL_STEP = { recall: 6, qbank: 7, mock: 7 };

const optionBase = 'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors duration-300';
const letterBase = 'w-5 h-5 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center';

const CardHeader = ({ label, right }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-xs font-bold uppercase tracking-wider text-brand-violet">{label}</span>
    {right}
  </div>
);

// ── Recall: walk the options, pick, mark correct, show the teaching point ──
const RECALL = {
  stem: 'A 58-year-old man has 40 min of crushing chest pain. ECG: ST elevation in II, III and aVF. Which artery is most likely occluded?',
  options: ['Left anterior descending', 'Right coronary artery', 'Left circumflex', 'Left main stem'],
  answer: 1,
  explanation: 'Inferior STEMI — the RCA supplies the inferior wall in most patients.',
};

const RecallCard = ({ step }) => {
  const hovered = step >= 1 && step <= 3 ? step - 1 : null;
  const picked = step >= 4 ? RECALL.answer : null;
  const revealed = step >= 5;
  return (
    <>
      <CardHeader
        label="Recall · Cardiology"
        right={
          <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
            <Timer className="w-3 h-3" /> 01:12
          </span>
        }
      />
      <p className="text-sm font-semibold leading-snug text-slate-900 mb-4">{RECALL.stem}</p>
      <ul className="space-y-2">
        {RECALL.options.map((opt, i) => {
          const isCorrect = revealed && i === RECALL.answer;
          return (
            <li
              key={opt}
              className={`${optionBase} ${
                isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : picked === i ? 'border-brand-violet bg-violet-50 text-slate-900'
                    : hovered === i ? 'border-slate-300 bg-slate-50 text-slate-900'
                      : 'border-slate-200 text-slate-700'
              }`}
            >
              <span className={`${letterBase} ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="grow">{opt}</span>
              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </li>
          );
        })}
      </ul>
      <AnimatePresence>
        {revealed && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900"
          >
            <strong>Correct.</strong> {RECALL.explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
};

// ── QBank: subject + topic practice. A wrong pick shows why it's wrong and
//    why the answer is right, then the question gets bookmarked. ──────────
const QBANK = {
  stem: 'A 2-year-old has a barking cough, inspiratory stridor and a low-grade fever. What is the most likely diagnosis?',
  options: ['Bronchiolitis', 'Croup', 'Epiglottitis', 'Inhaled foreign body'],
  answer: 1,
  wrong: 0,
  why: {
    0: 'Wheeze and crackles, usually under 12 months.',
    1: 'Barking cough + stridor — viral croup (parainfluenza).',
  },
};

const QBankCard = ({ step }) => {
  const hovered = step === 1 ? QBANK.wrong : null;
  const picked = step >= 2;
  const revealed = step >= 3;
  const bookmarked = step >= 6;
  return (
    <>
      <CardHeader
        label="QBank · Paediatrics · Respiratory"
        right={
          <motion.span animate={bookmarked ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
            <Bookmark className={`w-4 h-4 transition-colors ${bookmarked ? 'fill-brand-gold text-brand-gold' : 'text-slate-400'}`} />
          </motion.span>
        }
      />
      <p className="text-sm font-semibold leading-snug text-slate-900 mb-4">{QBANK.stem}</p>
      <ul className="space-y-2">
        {QBANK.options.map((opt, i) => {
          const isCorrect = revealed && i === QBANK.answer;
          const isWrong = picked && i === QBANK.wrong;
          return (
            <li
              key={opt}
              className={`${optionBase} flex-wrap ${
                isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : isWrong ? 'border-red-400 bg-red-50 text-red-900'
                    : hovered === i ? 'border-slate-300 bg-slate-50 text-slate-900'
                      : 'border-slate-200 text-slate-700'
              }`}
            >
              <span className={`${letterBase} ${
                isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="grow">{opt}</span>
              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isWrong && <XCircle className="w-4 h-4 text-red-500" />}
              <AnimatePresence>
                {revealed && QBANK.why[i] && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="basis-full overflow-hidden pl-7 text-xs leading-snug opacity-90"
                  >
                    {QBANK.why[i]}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">Q 12 of 180 · 9 correct</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-900">
          <RotateCcw className="w-3 h-3" /> Redo incorrect
        </span>
      </div>
    </>
  );
};

// ── Mock exam: timed, no feedback mid-exam (like the real AMC). The answer
//    autosaves, then the card flips to the results screen. ────────────────
const MOCK = {
  stem: 'A 30-year-old woman has 2 days of dysuria and frequency. She is not pregnant and is otherwise well. What is the best initial treatment?',
  options: ['Trimethoprim for 3 days', 'Ciprofloxacin for 7 days', 'Amoxicillin for 5 days', 'IV ceftriaxone'],
  picked: 0,
};

const useCountdown = (startSeconds, running) => {
  const [left, setLeft] = useState(startSeconds);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = Math.floor(left / 3600);
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const MockResult = ({ reduce }) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="text-center min-h-[380px] flex flex-col justify-center"
    >
      <CardHeader label="Mock exam · Results" />
      <div className="relative mx-auto my-4 w-28 h-28">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-slate-100" />
          <motion.circle
            cx="36" cy="36" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-brand-violet"
            strokeDasharray={c}
            initial={{ strokeDashoffset: reduce ? c * 0.22 : c }}
            animate={{ strokeDashoffset: c * 0.22 }}
            transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900">78%</span>
          <span className="text-[11px] font-semibold text-slate-500">117 / 150</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          ['117', 'Correct', 'bg-emerald-50 text-emerald-800'],
          ['29', 'Incorrect', 'bg-red-50 text-red-800'],
          ['4', 'Unanswered', 'bg-slate-100 text-slate-700'],
        ].map(([n, label, cls]) => (
          <div key={label} className={`rounded-lg py-2 ${cls}`}>
            <p className="text-base font-black">{n}</p>
            <p className="font-medium">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900">
        Review every question with full explanations
      </p>
    </motion.div>
  );
};

const MockCard = ({ step, reduce }) => {
  const time = useCountdown(2 * 3600 + 41 * 60 + 18, !reduce);
  const hovered = step === 1 ? MOCK.picked : null;
  const picked = step >= 2;
  const saved = step >= 3;
  if (step >= 5) return <MockResult reduce={reduce} />;
  return (
    <>
      <CardHeader
        label="Mock exam · AMC MCQ"
        right={
          <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 font-mono text-xs font-bold text-red-700">
            <Timer className="w-3 h-3" /> {time}
          </span>
        }
      />
      <p className="text-xs font-semibold text-slate-500 mb-2">Question 37 of 150</p>
      <p className="text-sm font-semibold leading-snug text-slate-900 mb-4">{MOCK.stem}</p>
      <ul className="space-y-2">
        {MOCK.options.map((opt, i) => (
          <li
            key={opt}
            className={`${optionBase} ${
              picked && i === MOCK.picked ? 'border-brand-violet bg-violet-50 text-slate-900'
                : hovered === i ? 'border-slate-300 bg-slate-50 text-slate-900'
                  : 'border-slate-200 text-slate-700'
            }`}
          >
            <span className={`${letterBase} ${picked && i === MOCK.picked ? 'bg-brand-violet text-white' : 'bg-slate-100 text-slate-600'}`}>
              {String.fromCharCode(65 + i)}
            </span>
            <span className="grow">{opt}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">{saved ? 37 : 36} answered · {saved ? 113 : 114} left</span>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800"
            >
              <Save className="w-3 h-3" /> Answer saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// ── Playback: steps within a mode, then on to the next mode ───────────────
export const useHeroPlayback = () => {
  const reduce = useReducedMotion();
  // One state object so advancing the step and rolling over to the next mode
  // happen in a single pure update.
  const [{ mode, step }, setPlayback] = useState({ mode: 0, step: 0 });

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setPlayback(({ mode: m, step: s }) =>
        s + 1 < MODES[m].steps ? { mode: m, step: s + 1 } : { mode: (m + 1) % MODES.length, step: 0 }
      );
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduce]);

  // Picking a tab restarts that mode's demo from the top.
  const choose = (i) => setPlayback({ mode: i, step: 0 });
  return { mode, step: reduce ? STILL_STEP[MODES[mode].id] : step, choose };
};

// Small floating glass chip. `depth` scales how far it drifts with the
// pointer, so near chips move more than the card behind them (parallax).
const Chip = ({ className, mx, my, depth, floatDelay, reduce, children }) => {
  const x = useTransform(mx, [-0.5, 0.5], [-depth, depth]);
  const y = useTransform(my, [-0.5, 0.5], [-depth, depth]);
  return (
    <motion.div style={reduce ? undefined : { x, y }} className={`absolute z-20 ${className}`} aria-hidden="true">
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
        className="rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-black/30 ring-1 ring-black/5"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * Hero product demo: the mode tabs and a card playing Recall → QBank → Mock
 * exam, tilting in 3D toward the pointer, with floating chips around it.
 * Pointer values (mx/my, -0.5…0.5) come from the hero section so the whole
 * hero is the tilt surface. `playback` (from useHeroPlayback) lives in the
 * hero too, so the headline can follow whichever mode is playing.
 */
export const HeroVisual = ({ mx, my, playback }) => {
  const reduce = useReducedMotion();
  const { mode, step, choose } = playback;
  const current = MODES[mode];

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 });

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-[540px] [perspective:1200px]">
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-brand-violet/40 blur-3xl" />

        {/* Mode tabs — real buttons, so a visitor can jump to the mode they
            care about. The highlight slides between them. */}
        <div className="relative z-10 flex rounded-full bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur" role="group" aria-label="Show a demo of">
          {MODES.map(({ id, label, icon: Icon }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => choose(i)}
              aria-pressed={mode === i}
              className="relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              {mode === i && (
                <motion.span
                  layoutId="hero-mode-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-violet to-brand-blue shadow-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative w-4 h-4" aria-hidden="true" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
          aria-hidden="true"
        >
          <div className="w-[310px] sm:w-[350px] min-h-[420px] rounded-2xl bg-white p-5 shadow-2xl shadow-black/40 ring-1 ring-black/5 [perspective:800px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                {current.id === 'recall' && <RecallCard step={step} />}
                {current.id === 'qbank' && <QBankCard step={step} />}
                {current.id === 'mock' && <MockCard step={step} reduce={reduce} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <Chip className="right-0 bottom-0" mx={mx} my={my} depth={36} floatDelay={1.2} reduce={reduce}>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Cardiology Notes</p>
            <div className="mt-1 h-1.5 w-28 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand-blue"
                initial={{ width: reduce ? '64%' : '0%' }}
                animate={{ width: '64%' }}
                transition={{ duration: 1.4, delay: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </Chip>

      <Chip className="left-0 bottom-0 hidden sm:block" mx={mx} my={my} depth={20} floatDelay={0.6} reduce={reduce}>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Every option explained</p>
            <p className="text-xs text-slate-500">Learn the why, not just the answer</p>
          </div>
        </div>
      </Chip>
    </div>
  );
};
