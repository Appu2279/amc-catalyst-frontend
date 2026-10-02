import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Quote, UserRound, ArrowRight, BadgeCheck } from 'lucide-react';
import { RESULTS, TESTIMONIALS } from '@/content/testimonials';

const initials = (name) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const Avatar = ({ name, photo, className = 'w-12 h-12' }) => {
  if (photo) {
    return <img src={photo} alt="" loading="lazy" className={`${className} rounded-full object-cover object-top ring-2 ring-white`} />;
  }
  return (
    <span aria-hidden="true" className={`${className} rounded-full bg-brand-violet/10 text-brand-violet font-bold flex items-center justify-center`}>
      {name ? initials(name) : <UserRound className="w-1/2 h-1/2" />}
    </span>
  );
};

export const TestimonialCard = ({ quote, name, role, photo, delay = 0 }) => (
  <motion.figure
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className="relative flex flex-col h-full bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
  >
    <Quote className="w-8 h-8 text-brand-violet/30 mb-4" aria-hidden="true" />
    <blockquote className="grow text-base leading-relaxed text-slate-700">“{quote}”</blockquote>
    <figcaption className="mt-6 flex items-center gap-3">
      <Avatar name={name} photo={photo} />
      <span>
        <span className="block font-bold text-brand-dark">{name ?? 'AMC Catalyst community member'}</span>
        <span className="block text-sm text-slate-500">{role}</span>
      </span>
    </figcaption>
  </motion.figure>
);

// Portrait card for a doctor who passed: photo, name and a gold result badge.
export const ResultCard = ({ name, photo, result, index = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      initial={reduce ? false : { opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 5) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="theme-fixed group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-200 shadow-md"
    >
      <img
        src={photo}
        alt={`${name}`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 p-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950">
          <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" /> {result}
        </span>
        <span className="mt-2 block text-base font-black leading-tight text-white">{name}</span>
      </figcaption>
    </motion.figure>
  );
};

// Overlapping row of result photos.
export const AvatarStack = ({ size = 'w-12 h-12', max = RESULTS.length }) => (
  <div className="flex -space-x-3">
    {RESULTS.slice(0, max).map((r, i) => (
      <motion.img
        key={r.name}
        src={r.photo}
        alt=""
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: i * 0.05 }}
        className={`${size} rounded-full object-cover object-top ring-2 ring-white`}
      />
    ))}
  </div>
);

// Homepage section: the students' words, plus a link to the full wall of results.
export const Testimonials = () => (
  <section aria-labelledby="testimonials-heading" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-brand-gold">From our students</p>
          <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-black tracking-tight text-balance text-brand-dark">
            {RESULTS.length} doctors. One result: AMC-1 cleared.
          </h2>
        </div>
        <Link
          to="/testimonials"
          className="group inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 pr-5 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
        >
          <AvatarStack size="w-10 h-10" max={5} />
          <span className="text-sm font-bold text-brand-dark">
            Meet them all
            <ArrowRight className="inline w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} {...t} delay={i * 0.08} />)}
      </div>
    </div>
  </section>
);
