import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  FileText, BarChart3, Target, Users, CalendarDays, Globe2, ArrowRight,
  CheckCircle2, Lightbulb, Send, MessageCircle, Mic, MicOff, Video, Hand, PhoneOff,
} from 'lucide-react';

const PROMISES = [
  { icon: FileText, title: 'Detailed MCQ explanations', body: 'Step-by-step discussion of key questions.' },
  { icon: BarChart3, title: 'High-yield exam pearls', body: 'Important takeaways for the real exam.' },
  { icon: Target, title: 'Analyse your mistakes', body: 'Learn from errors and improve your strategy.' },
  { icon: Users, title: 'Live discussion session', body: 'Interactive discussion with exam-focused explanations.' },
];

const OPTIONS = ['Asthma', 'Bronchiectasis', 'Pulmonary embolism', 'Interstitial lung disease', 'Community acquired pneumonia'];
const CORRECT = 3;

const ATTENDEES = [
  { initials: 'PR', tone: 'bg-rose-200 text-rose-800' },
  { initials: 'AK', tone: 'bg-sky-200 text-sky-800' },
  { initials: 'SM', tone: 'bg-emerald-200 text-emerald-800' },
  { initials: 'JT', tone: 'bg-amber-200 text-amber-800' },
];

const CHAT = [
  { name: 'Priya', text: 'I picked bronchiectasis 😅' },
  { name: 'Arjun', text: 'Why not PE here?' },
  { name: 'Faculty', text: 'No acute onset, and the X-ray shows reticular change — think ILD.', faculty: true },
  { name: 'Sara', text: 'Restrictive pattern on spirometry ✅' },
  { name: 'James', text: 'Super clear, thank you!' },
];
const VISIBLE_MESSAGES = 4;

/**
 * A laptop showing the live discussion class: the faculty walking through a
 * Grand Mock question on a shared slide while students chat alongside. The
 * chat scrolls on a loop; it holds still for reduced-motion visitors.
 */
const DiscussionLaptop = () => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef(null);
  // Only tick while on screen — no point re-rendering a demo nobody sees.
  const inView = useInView(ref);
  const [chatEnd, setChatEnd] = useState(VISIBLE_MESSAGES);

  useEffect(() => {
    if (shouldReduceMotion || !inView) return undefined;
    const timer = setInterval(() => setChatEnd((n) => (n >= CHAT.length ? VISIBLE_MESSAGES - 1 : n + 1)), 2200);
    return () => clearInterval(timer);
  }, [shouldReduceMotion, inView]);

  const messages = CHAT.slice(Math.max(0, chatEnd - VISIBLE_MESSAGES), chatEnd);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-xl">
      {/* Screen */}
      <div className="rounded-t-2xl border-[10px] border-b-[14px] border-slate-800 bg-slate-800 shadow-2xl">
        <div className="overflow-hidden rounded-md bg-slate-900">
          {/* Call header */}
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <p className="truncate text-[11px] font-black text-white">Grand Mock Discussion · Q1 of 150</p>
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse motion-reduce:animate-none" /> Live
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300">
                <Users className="h-3 w-3" /> 248
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 px-2 pb-2 sm:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
            {/* Shared slide */}
            <div className="relative rounded-lg bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-violet">Question 1 · Respiratory</p>
              <p className="mt-1.5 text-[10px] leading-snug text-slate-700">
                45F, progressive shortness of breath and dry cough. CXR: bilateral reticular opacities. Most likely
                diagnosis?
              </p>
              <ul className="mt-2 space-y-1">
                {OPTIONS.map((option, i) => {
                  const isCorrect = i === CORRECT;
                  return (
                    <li
                      key={option}
                      className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[9px] ${
                        isCorrect ? 'border-green-300 bg-green-50 font-bold text-green-700' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="font-black">{String.fromCharCode(65 + i)}</span>
                      {option}
                      {isCorrect && <CheckCircle2 className="ml-auto h-3 w-3" />}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 mr-16 flex items-start gap-1 rounded bg-amber-50 px-1.5 py-1 text-[9px] font-semibold text-amber-800">
                <Lightbulb className="mt-px h-3 w-3 shrink-0" /> Pearl: insidious onset + reticular pattern + restrictive PFTs = ILD
              </p>

              {/* Faculty camera */}
              <div className="absolute bottom-2 right-2 flex h-12 w-14 flex-col items-center justify-center rounded-md border-2 border-green-400 bg-slate-700 shadow-lg">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-violet text-[9px] font-black text-white">
                  <Mic className="h-3 w-3" />
                </span>
                <span className="mt-0.5 text-[7px] font-bold text-white">Faculty</span>
              </div>
            </div>

            {/* Live chat */}
            <div className="flex flex-col rounded-lg bg-slate-800 p-2">
              <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <MessageCircle className="h-3 w-3" /> Live chat
              </p>
              <ul className="mt-1.5 flex-1 space-y-1.5">
                {messages.map((m) => (
                  <motion.li
                    key={m.text}
                    layout={!shouldReduceMotion}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] leading-snug"
                  >
                    <span className={`font-black ${m.faculty ? 'text-amber-300' : 'text-violet-300'}`}>{m.name}</span>{' '}
                    <span className="text-slate-200">{m.text}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-1.5 rounded bg-slate-700 px-1.5 py-1 text-[8px] text-slate-400">Ask a question…</div>
            </div>
          </div>

          {/* Attendees and call controls */}
          <div className="flex items-center justify-between border-t border-slate-800 px-3 py-1.5">
            <div className="flex -space-x-1.5">
              {ATTENDEES.map((a) => (
                <span
                  key={a.initials}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 text-[7px] font-black ${a.tone}`}
                >
                  {a.initials}
                </span>
              ))}
              <span className="flex h-5 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-700 text-[7px] font-black text-slate-200">
                +244
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[MicOff, Video, Hand].map((Icon, i) => (
                <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-200">
                  <Icon className="h-2.5 w-2.5" />
                </span>
              ))}
              <span className="flex h-5 items-center justify-center rounded-full bg-red-600 px-2 text-white">
                <PhoneOff className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Base */}
      <div className="mx-auto h-3 w-[112%] -translate-x-[5.5%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-lg" />
    </div>
  );
};

/**
 * Homepage announcement for the 15 October Grand Mock discussion, adapted
 * from the client's poster. The live session link goes out in the premium
 * Telegram/WhatsApp groups, so the call to action is a plan.
 */
export const GrandMockDiscussion = () => (
  <section
    id="grand-mock-discussion"
    className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-br from-violet-50 via-white to-indigo-50 scroll-mt-20"
  >
    <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-violet/10 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />

    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 [&>*]:min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-violet">
            For all AMC 1 aspirants
          </p>

          <h2 className="mt-4 font-black leading-[0.95] text-brand-dark">
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-5xl md:text-7xl text-brand-violet">FREE</span>
              <span className="flex items-center gap-2 rounded-lg bg-brand-violet/10 px-3 py-1 text-sm md:text-lg font-black uppercase tracking-widest text-brand-violet">
                <CalendarDays className="h-5 w-5" /> 15 October · 7 PM IST
              </span>
            </span>
            <span className="mt-2 block text-4xl md:text-6xl">Grand Mock</span>
            <span className="block text-4xl md:text-6xl text-gradient-brand">Discussion</span>
          </h2>

          <p className="mt-6 max-w-md text-base md:text-lg font-semibold text-slate-600">
            Review key questions. Understand the reasoning. Come back stronger.
          </p>
          <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
            A live walkthrough of the Grand Mock, question by question, with exam-focused explanations.
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

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-violet-200 bg-white/80 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-red-600" />
              <div className="leading-tight">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Mock discussion on</p>
                <p className="text-2xl font-black text-red-600">15 OCTOBER</p>
                <p className="mt-0.5 text-sm font-black text-slate-700">7:00 PM IST</p>
              </div>
            </div>
            <span className="hidden h-10 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Globe2 className="h-5 w-5 text-brand-violet" /> Open to everyone worldwide
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-black text-white shadow-md hover:bg-brand-violet"
            >
              Get a plan &amp; join our premium group <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-slate-500">
              The live session link is shared in our
              <span className="inline-flex items-center gap-1 font-bold text-slate-600"><Send className="h-3.5 w-3.5" /> Telegram</span>
              &amp;
              <span className="inline-flex items-center gap-1 font-bold text-slate-600"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</span>
              groups for premium members.
            </p>
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
          <DiscussionLaptop />
        </motion.div>
      </div>
    </div>
  </section>
);
