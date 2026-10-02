import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Megaphone, BookOpen, Users, Plane, TrendingUp, Lock, ArrowRight, Maximize2, BadgePercent,
} from 'lucide-react';
import { Lightbox } from '@/components/ui/Lightbox';
import { Glow } from '@/components/ui/Glow';

const POSTER = '/images/announcements/special-course-2027.jpg';

const FEATURES = [
  { icon: BookOpen, title: 'Early guidance', body: 'Understand the Australian pathway from your student years.' },
  { icon: Users, title: 'Non-NEET students focused', body: 'A dedicated pathway, as they need this most.' },
  { icon: Plane, title: 'Australian internship pathway', body: 'Focused learning for your future.' },
  { icon: TrendingUp, title: 'Expert support', body: 'Guidance, strategy and mentorship at every step.' },
];

/**
 * Announcement for the upcoming 2027 course for final- and second-last-year
 * medical students, shown on the Pricing page.
 *
 * Deliberately styled as an advert rather than a plan: its own forest-green
 * and brown palette (from the poster), an "Announcement" badge, a "not open
 * for enrolment" tag and no Enrol button — so nobody mistakes it for something
 * they can buy today. The poster's text is repeated as real text (readable on
 * small screens and by screen readers); the poster itself opens full-size.
 *
 * Dark in both themes (.theme-fixed).
 */
export const CourseAnnouncement = () => {
  const [posterOpen, setPosterOpen] = useState(false);

  return (
    <motion.section
      aria-labelledby="course-2027-heading"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="theme-fixed relative mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f2a1f] via-[#143826] to-[#2a2116] p-6 sm:p-10 lg:p-12 shadow-2xl ring-1 ring-white/10"
    >
      {/* Warm glows + a faint diagonal stripe so it reads as a promo panel */}
      <Glow className="-top-24 -right-16 w-96 h-96" color="rgba(217, 119, 6, 0.25)" />
      <Glow className="-bottom-32 -left-24 w-[28rem] h-[28rem]" color="rgba(16, 185, 129, 0.18)" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:repeating-linear-gradient(135deg,white_0_1px,transparent_1px_14px)]"
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          {/* Advert labelling */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#2a1a08] shadow-lg shadow-amber-500/20">
              <Megaphone className="w-3.5 h-3.5" aria-hidden="true" /> Announcement · Coming 2027
            </span>
            <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-emerald-100/80">
              Not open for enrolment yet
            </span>
          </div>

          {/* Narrower screens: a compact poster thumbnail here instead of the
              full poster column, which would repeat all of the text below. */}
          <button
            type="button"
            onClick={() => setPosterOpen(true)}
            className="lg:hidden mb-6 flex w-full items-center gap-4 rounded-2xl bg-white/[0.06] p-3 pr-4 text-left ring-1 ring-white/10 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <img src={POSTER} alt="" loading="lazy" className="h-20 w-[3.4rem] shrink-0 rounded-lg object-cover object-top ring-2 ring-white/80" />
            <span className="grow">
              <span className="block text-sm font-bold text-white">See the announcement poster</span>
              <span className="block text-xs text-emerald-100/70">Tap to view full size</span>
            </span>
            <Maximize2 className="w-4 h-4 text-emerald-100/70 shrink-0" aria-hidden="true" />
          </button>

          <p className="text-lg italic font-semibold text-amber-300">By FMGs, for FMGs</p>
          <h2 id="course-2027-heading" className="mt-1 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
            Special course{' '}
            <span className="inline-block -rotate-1 rounded-xl bg-[#6b3f1d] px-3 py-1 text-amber-100 shadow-lg">
              from 2027
            </span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-emerald-100/70">
            For future Australian doctors
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed">
              For medical students in their{' '}
              <strong className="text-amber-300">final year &amp; second-last year</strong>{' '}
              who want to go straight to Australia, or are planning an Australian internship.
            </p>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                className="flex gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 hover:bg-white/[0.08] transition-colors"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{title}</span>
                  <span className="block text-sm text-emerald-50/70 leading-snug">{body}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-300/30">
              <BadgePercent className="w-4 h-4" aria-hidden="true" /> Group admissions will have discounts
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15">
              <Lock className="w-4 h-4" aria-hidden="true" /> Pricing will be updated soon
            </span>
          </div>

          <Link
            to="/contact"
            className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#143826] shadow-lg hover:bg-amber-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Ask about this course
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-sm italic text-amber-200/80">Stay tuned!</p>
        </div>

        {/* The poster — tap to see it full size (wide screens only) */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setPosterOpen(true)}
            aria-label="View the full announcement poster"
            className="group relative block w-full rotate-2 hover:rotate-0 hover:scale-[1.02] motion-reduce:hover:scale-100 transition-transform duration-300 cursor-zoom-in rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          >
            <img
              src={POSTER}
              alt="Poster: Dr Solosailor’s AMC Catalyst special course from 2027, for final and second-last year medical students"
              loading="lazy"
              className="w-full rounded-2xl shadow-2xl ring-4 ring-white/90"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-90 group-hover:opacity-100">
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> View poster
            </span>
          </button>
        </div>
      </div>

      <Lightbox src={posterOpen ? POSTER : null} onClose={() => setPosterOpen(false)} />
    </motion.section>
  );
};
