import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Users,
  SendHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const FAQS = [
  {
    q: "How quickly do I get access to Notes and Mocks after joining?",
    a: "Access is granted immediately upon subscription verification. You will be able to access the reading library and mock exams right from your student dashboard."
  },
  {
    q: "What is included in Dr. Solosailor's 22 AMC Catalyst Notes suite?",
    a: "The complete index includes 22 high-yield notes and resources split into Part 1 (10 Notes including Cardiology, Psychiatry, AMC-1 Route Map & One-Liners) and Part 2 (12 Notes including Venom & Bites, Statistics, Ethics, Surgery, Gynaecology & Preventative Medicine)."
  },
  {
    q: "How long is my subscription valid for?",
    a: "All AMC Catalyst plans come with 6 months of full access. Additional month-by-month extensions can easily be added if you require more time before your exam date."
  },
  {
    q: "Can I get assistance with AMC exam registration & eligibility?",
    a: "Absolutely! We provide step-by-step guidance for AMC eligibility checking, document verification, and choosing your exam date."
  }
];

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Question',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate short network call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="bg-white selection:bg-brand-violet/10 pt-20">
      {/* Hero Header */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-violet/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>We're Here For Your AMC Journey</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
              Let's Connect & <br />
              <span className="text-gradient-brand italic">Elevate Your Preparation.</span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Have questions about Dr. Solosailor’s AMC CATALYST Notes, Mock Exams, or enrollment?
              Our medical prep team is here to guide you every step of the way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Info Cards Row */}
      <section className="relative -mt-12 z-20 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-brand-violet/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 text-brand-violet flex items-center justify-center mb-4 group-hover:bg-brand-violet group-hover:text-white transition-all">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-brand-dark mb-1">Direct Email</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Reach out directly to Dr. Solosailor and our support team.</p>
            <a
              href="mailto:dr.solosailor@gmail.com"
              className="text-xs font-bold text-brand-violet hover:underline flex items-center gap-1"
            >
              dr.solosailor@gmail.com <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-brand-blue/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4 group-hover:bg-brand-blue group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-brand-dark mb-1">Community & Support</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Join our active doctor network & Telegram discussion channels.</p>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              Join Catalyst Community <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-amber-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-brand-dark mb-1">Response Guarantee</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">We aim to respond to all candidate inquiries within 24 hours.</p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Priority Support Available
            </span>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-brand-violet text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5" /> Direct Support Form
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight leading-tight">
              Send us a message, <br />
              <span className="text-gradient-brand">we'll guide your next step.</span>
            </h2>

            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Whether you need assistance choosing the right AMC Catalyst package, want detail on 
              our 22 High-Yield Notes index, or need help with payment options, drop us a line below.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Structured assistance for international medical graduates (IMGs)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant response & guidance on course access</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Authored & managed by Dr. Solosailor</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl relative overflow-hidden">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-12 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-brand-dark">Message Sent Successfully!</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                      Thank you for contacting Dr. Solosailor’s AMC CATALYST team. We have received your inquiry and will reply to <span className="font-bold text-slate-800">{formData.email}</span> shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', subject: 'General Question', message: '' });
                      }}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-brand-violet text-white text-xs font-bold shadow-md hover:bg-brand-violet-hover transition"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form key="form" onSubmit={handleSubmit} className="space-y-5">
                    <h3 className="text-xl font-black text-brand-dark mb-4">Contact Form</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Dr. John Doe"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="doctor@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet transition"
                      >
                        <option value="General Question">General Inquiry</option>
                        <option value="Courses & Notes">AMC Catalyst Notes & Package Details</option>
                        <option value="Registration Assistance">AMC Exam Registration Guidance</option>
                        <option value="Technical Support">Platform & Account Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Your Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Write your questions or message here..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet transition"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 bg-brand-dark hover:bg-brand-violet text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <SendHorizontal className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-violet mb-2">
              <HelpCircle className="w-4 h-4" /> Support Knowledge Base
            </div>
            <h2 className="text-3xl font-black text-brand-dark">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between gap-4 hover:text-brand-violet transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-brand-violet shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
