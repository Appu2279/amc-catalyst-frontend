import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Quote, Sparkles, Trophy } from 'lucide-react';
import { RESULTS, TESTIMONIALS } from '@/content/testimonials';
import { ResultCard, TestimonialCard } from '@/components/home/Testimonials';
import { Glow, GLOW } from '@/components/ui/Glow';

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';

const Hero = () => {
  const reduce = useReducedMotion();
  return (
    <section className="theme-fixed relative overflow-hidden bg-slate-950 pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <Glow className="-top-40 left-1/4 w-[34rem] h-[34rem]" color={GLOW.violet(0.4)} animation="animate-drift-1" />
        <Glow className="-bottom-40 right-1/4 w-[30rem] h-[30rem]" color={GLOW.gold(0.25)} animation="animate-drift-2" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 mb-7 text-xs font-bold uppercase tracking-[0.15em] text-amber-300"
        >
          <Trophy className="w-4 h-4" aria-hidden="true" /> AMC examination — cleared
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white text-balance"
        >
          {RESULTS.length} of our own.{' '}
          <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
            One result.
          </span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
        >
          Different journeys, the same finish line — and a community that walked it together.
          These doctors prepared with AMC Catalyst and cleared AMC-1.
        </motion.p>

        {/* Faces fan in one after another */}
        <div className="mt-12 flex justify-center -space-x-4" aria-hidden="true">
          {RESULTS.map((r, i) => (
            <motion.img
              key={r.name}
              src={r.photo}
              alt=""
              initial={reduce ? false : { opacity: 0, y: 30, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.4 + i * 0.07 }}
              whileHover={reduce ? undefined : { y: -8, scale: 1.1, zIndex: 20 }}
              className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover object-top ring-4 ring-slate-950"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Large photo + quote. `reverse` puts the photo on the right, so a run of
// stories alternates sides. Long quotes get a smaller type size so they
// don't turn into a wall of display text.
const FeaturedStory = ({ quote, name, role, photo, reverse = false, tinted = false }) => (
  <section className={`py-16 lg:py-24 overflow-x-clip ${tinted ? 'bg-slate-50 border-y border-slate-100' : ''}`}>
    <div className={`max-w-6xl mx-auto px-6 lg:px-8 grid gap-10 lg:gap-16 items-center ${
      reverse ? 'md:grid-cols-[1.2fr_0.8fr]' : 'md:grid-cols-[0.8fr_1.2fr]'
    }`}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 30 : -30, rotate: reverse ? 3 : -3 }}
        whileInView={{ opacity: 1, x: 0, rotate: reverse ? 2 : -2 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative mx-auto w-full max-w-sm ${reverse ? 'md:order-2' : ''}`}
      >
        <div aria-hidden="true" className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-brand-violet/30 to-brand-gold/30 blur-2xl" />
        <img src={photo} alt={name} className="relative w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl" />
        <span className={`absolute -bottom-4 ${reverse ? '-left-4' : '-right-4'} inline-flex items-center gap-1.5 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 shadow-xl`}>
          <BadgeCheck className="w-4 h-4" aria-hidden="true" /> {role}
        </span>
      </motion.div>

      <motion.figure
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-brand-violet">Student story</p>
        <Quote className="w-12 h-12 text-brand-violet/30 mb-4" aria-hidden="true" />
        <blockquote className={`font-bold leading-snug tracking-tight text-brand-dark ${
          quote.length > 320 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
        }`}>
          “{quote}”
        </blockquote>
        <figcaption className="mt-6 text-base font-bold text-slate-600">— {name}</figcaption>
      </motion.figure>
    </div>
  </section>
);

export const Testimonials = () => {
  const featured = TESTIMONIALS.filter((t) => t.featured);
  const others = TESTIMONIALS.filter((t) => !t.featured);

  return (
    <div className="bg-white">
      <Hero />

      {featured.map((t, i) => (
        <FeaturedStory key={t.name ?? i} {...t} reverse={i % 2 === 1} tinted={i % 2 === 1} />
      ))}

      {/* Wall of results */}
      <section aria-labelledby="results-heading" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-brand-gold">Wall of results</p>
            <h2 id="results-heading" className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark text-balance">
              Every one of them cleared AMC-1.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {RESULTS.map((r, i) => <ResultCard key={r.name} {...r} index={i} />)}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="words-heading" className="py-20 lg:py-28">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-brand-violet">In their words</p>
              <h2 id="words-heading" className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark text-balance">
                What the community says.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {others.map((t, i) => <TestimonialCard key={i} {...t} delay={i * 0.1} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pb-20 lg:pb-28 px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="theme-fixed relative max-w-5xl mx-auto overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 md:py-20 text-center"
        >
          <Glow className="-top-24 left-1/3 w-96 h-96" color={GLOW.violet(0.5)} />
          <div className="relative">
            <Sparkles className="mx-auto mb-5 w-8 h-8 text-amber-300" aria-hidden="true" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white text-balance">
              Your name could be next on this wall.
            </h2>
            <p className="mt-4 text-lg text-slate-300">Start free — upgrade only when you’re ready.</p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/register"
                className={`inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-blue text-white text-base font-bold shadow-[0_10px_40px_-10px_rgba(124,58,237,0.8)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-transform ${FOCUS_RING}`}
              >
                Create free account <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                to="/pricing"
                className={`inline-flex items-center justify-center h-14 px-7 rounded-2xl border border-white/20 bg-white/5 text-white text-base font-bold hover:bg-white/10 transition-colors ${FOCUS_RING}`}
              >
                View plans & pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
