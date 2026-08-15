import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Stethoscope, CheckCircle2, Mail, LayoutDashboard, Rocket, ArrowRight, ShieldCheck,
} from 'lucide-react';

// Reached via navigate() from the register form, which passes the new registrant's
// details in router state. Anyone landing here directly still gets a sensible page.
export const RegistrationSuccess = () => {
  const { state } = useLocation();
  const firstName = (state?.fullName ?? '').trim().split(' ')[0];
  const email = state?.email;

  const steps = [
    {
      icon: Mail,
      title: 'Confirmation on its way',
      body: email
        ? `We have your details against ${email}. Keep an eye on that inbox — everything about launch goes there first.`
        : 'Everything about the launch goes to the email address you registered with, so keep an eye on that inbox.',
    },
    {
      icon: Rocket,
      title: 'Launching this month',
      body: 'We are putting the final polish on the question bank, mock exams and recall library. Pre-registered members get in first.',
    },
    {
      icon: LayoutDashboard,
      title: 'Your dashboard opens shortly',
      body: 'The moment we go live your account is switched on — no second sign-up, no waiting in line. Your dashboard will simply be there.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16 font-sans relative overflow-hidden">
      {/* Same dot grid as the register screen, so this reads as the next step of one flow */}
      <div className="absolute inset-0 [background:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-brand-violet/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
          <Stethoscope className="w-6 h-6 text-brand-violet transition-transform group-hover:rotate-12" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-dark">AMC Catalyst</span>
        </Link>

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
          className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-8 h-8 text-brand-violet" />
        </motion.div>

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-4">
          Registration confirmed
        </p>

        <h1 className="text-4xl md:text-6xl font-black text-brand-dark leading-[0.95] tracking-tighter mb-6">
          {firstName ? <>You are in,<br />{firstName}.</> : <>You are<br />on the list.</>}
        </h1>

        <p className="text-slate-500 font-medium leading-relaxed max-w-lg mb-12">
          Your place is reserved. We are opening dashboards in batches as we roll out the
          release this month, and yours will be ready shortly — we will email you the
          moment it is live.
        </p>

        <div className="space-y-1 mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-5 py-5 border-t border-slate-100"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-brand-violet" />
              </div>
              <div>
                <h2 className="text-sm font-black text-brand-dark tracking-tight mb-1">{step.title}</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="flex-1">
            <button className="w-full py-5 bg-brand-dark hover:bg-brand-violet text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-dark/10 transition-all">
              Back to home <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link to="/features" className="flex-1">
            <button className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-brand-dark rounded-2xl font-bold transition-all border border-slate-100">
              Explore what is coming
            </button>
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Your details are stored securely
          </span>
        </div>
      </motion.div>
    </div>
  );
};
