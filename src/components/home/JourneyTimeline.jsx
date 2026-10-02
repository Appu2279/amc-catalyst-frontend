import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { UserPlus, Unlock, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create a free account',
    desc: 'Sign up with your name, email and a password — under a minute, no credit card, no waiting for approval.',
    cta: { label: 'Sign up free', to: '/register' },
    dot: 'bg-brand-violet',
    ctaClass: 'bg-brand-violet',
  },
  {
    icon: Unlock,
    title: 'Try the free samples',
    desc: 'Once you’re signed in, Notes, QBank, Recall and Mock Exams each have real sample content marked "Free" — the actual thing, not a separate demo.',
    dot: 'bg-brand-blue',
  },
  {
    icon: QrCode,
    title: 'Pay to unlock everything',
    desc: 'Pick a plan, scan the QR code to pay, then submit your payment reference. We verify transfers by hand, so full access usually opens within two working days.',
    cta: { label: 'View plans', to: '/pricing' },
    dot: 'bg-brand-gold',
    ctaClass: 'bg-brand-gold',
  },
];

/**
 * "How it works" — added after student feedback that it wasn't obvious what
 * to actually do on the site. A vertical line fills as the visitor scrolls
 * through the steps, and each step lights up as the line reaches it.
 */
export const JourneyTimeline = () => {
  const reduce = useReducedMotion();
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100 scroll-mt-20 overflow-x-clip">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20">
        <div className="lg:sticky lg:top-32 self-start">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-brand-gold">Getting started</p>
          <h2 id="how-it-works-heading" className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark text-balance">
            From sign-up to studying in three steps.
          </h2>
          <p className="mt-5 text-lg text-slate-600">No guesswork — here’s exactly what happens.</p>
          <p className="mt-8 flex items-start gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
            Payments are checked by hand against our bank statement — access usually opens within two working days of your transfer.
          </p>
        </div>

        <ol ref={listRef} className="relative space-y-6">
          {/* Track + scroll-driven fill */}
          <span aria-hidden="true" className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200" />
          <motion.span
            aria-hidden="true"
            style={reduce ? undefined : { scaleY: fill }}
            className="absolute left-6 top-6 bottom-6 w-0.5 origin-top bg-gradient-to-b from-brand-violet via-brand-blue to-brand-gold"
          />

          {STEPS.map(({ icon: Icon, title, desc, cta, dot, ctaClass }, idx) => (
            <motion.li
              key={title}
              initial={reduce ? false : { opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative pl-20"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.6 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`absolute left-0 top-0 w-12 h-12 rounded-2xl ${dot} text-white flex items-center justify-center shadow-lg ring-8 ring-slate-50`}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </motion.span>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Step {idx + 1}</p>
                <h3 className="text-xl md:text-2xl font-black text-brand-dark mb-2">{title}</h3>
                <p className="text-base text-slate-600 leading-relaxed">{desc}</p>
                {cta && (
                  <Link
                    to={cta.to}
                    className={`mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-xl ${ctaClass} text-white text-sm font-bold shadow-md hover:brightness-110 transition-[filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet`}
                  >
                    {cta.label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};
