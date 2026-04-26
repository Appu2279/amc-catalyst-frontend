import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PlayCircle, Star, BookOpen, Zap, Target,
  ArrowRight, Sparkles, Stethoscope, Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const { count: doctorsCount, ref: doctorsRef } = useCountUp(0, 12000, 2);
  const { count: mcqsCount, ref: mcqsRef } = useCountUp(0, 5000, 2);
  const { count: passRate, ref: rateRef } = useCountUp(0, 98.5, 2);

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
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <PlayCircle className="w-5 h-5 text-brand-gold" />
                  </div>
                  <span className="text-xs font-bold text-brand-dark">Watch Demo</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" 
                  className="w-full h-[300px] md:h-[400px] object-cover grayscale-[20%]"
                  alt="Medical Professional"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-brand-gold" />
                  <div>
                    <p className="text-lg font-black text-brand-dark">{passRate.toFixed(1)}%</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pass Rate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. TIGHT STATS BAR */}
      <section className="py-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div ref={doctorsRef}>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">{doctorsCount.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Doctors Trained</p>
            </div>
            <div ref={mcqsRef}>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">{mcqsCount.toLocaleString()}+</h3>
              <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">MCQ Questions</p>
            </div>
            <div ref={rateRef}>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark">{passRate.toFixed(1)}%</h3>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPACT BENTO FEATURES */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-violet mb-2">CORE PLATFORM</h2>
             <h3 className="text-3xl font-black text-brand-dark">Everything you need to succeed.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              icon: <BookOpen />, title: "Adaptive QBank", desc: "5,000+ questions that adapt to your performance.",
              color: "brand-violet"
            }, {
              icon: <Zap />, title: "High-Yield Lectures", desc: "200+ hours of focused video content.",
              color: "brand-blue"
            }, {
              icon: <Target />, title: "Mock Exams", desc: "Full simulations replicating real exam pressure.",
              color: "brand-gold"
            }].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 text-${item.color} flex items-center justify-center mb-4 group-hover:bg-${item.color} group-hover:text-white transition-all`}>
                   {React.cloneElement(item.icon, { className: "w-5 h-5" })}
                </div>
                <h4 className="text-lg font-black text-brand-dark mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
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