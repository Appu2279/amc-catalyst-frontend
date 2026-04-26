import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Users, Award, Globe, Heart, Sparkles, Plus, Stethoscope, ChevronDown } from 'lucide-react';

const Page = ({ children, index, total, bgColor = "bg-white" }) => {
  const container = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scale down the underlying page slightly
  const scale = useTransform(smoothProgress, [0, 1], [1, 0.9]);
  // Darken the underlying page as it gets covered (No Opacity used here)
  const filter = useTransform(smoothProgress, [0, 1], ["brightness(100%)", "brightness(50%)"]);

  return (
    <div ref={container} className="relative h-screen">
      <motion.section
        style={{ 
          scale: index === total - 1 ? 1 : scale, 
          filter: index === total - 1 ? "none" : filter,
          zIndex: index 
        }}
        className={`sticky top-0 w-full h-screen flex flex-col items-center justify-center ${bgColor} rounded-t-[3.5rem] shadow-[0_-30px_60px_rgba(0,0,0,0.12)] border-t border-slate-200/50 overflow-hidden`}
      >
        {children}
      </motion.section>
    </div>
  );
};

export const About = () => {
  return (
    <div className="bg-slate-200 selection:bg-brand-violet/20">
      
      {/* 1. HERO PAGE */}
      <Page index={0} total={4} bgColor="bg-white">
        <div className="absolute top-20 right-[-5%] text-[15vw] font-black text-slate-50 select-none pointer-events-none tracking-tighter">
          CATALYST
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 text-brand-gold mb-10">
              <div className="p-2 bg-brand-gold/10 rounded-lg">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.4em]">The New Standard</span>
            </div>
            
            <h1 className="text-7xl md:text-[10vw] font-black text-brand-dark tracking-tighter leading-[0.75] mb-12">
              Medicine <br />
              <span className="text-gradient-brand italic">Refined.</span>
            </h1>

            <div className="flex flex-col md:flex-row gap-12 items-start md:items-center mt-16">
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-sm">
                Bridging the gap between global expertise and Australian healthcare.
              </p>
              <div className="flex flex-col items-center gap-2 animate-bounce mt-8 md:mt-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Scroll</span>
                <ChevronDown className="w-4 h-4 text-brand-violet" />
              </div>
            </div>
          </motion.div>
        </div>
      </Page>

      {/* 2. MISSION PAGE */}
      <Page index={1} total={4} bgColor="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-6 relative">
              <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-50">
                <img 
                  src="https://images.unsplash.com/photo-1551847677-dc82d764e1eb?auto=format&fit=crop&w=1600&q=80" 
                  alt="Team" 
                  className="w-full h-[500px] object-cover grayscale-[20%]"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-brand-violet p-10 rounded-[2.5rem] shadow-2xl">
                <Heart className="w-12 h-12 text-white fill-white/20" />
              </div>
            </div>
            <div className="lg:col-span-6">
              <h2 className="text-5xl font-black text-brand-dark tracking-tighter mb-8 italic">Our Mission</h2>
              <p className="text-2xl text-slate-500 font-medium leading-snug mb-12">
                Engineering a transparent, high-yield pathway for international graduates to excel within the Australian system.
              </p>
              <div className="h-1 w-20 bg-brand-gold mb-12" />
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest mb-2">Heritage</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Founded by specialists who mastered the AMC pathway themselves.</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest mb-2">Impact</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Active in 50+ countries with a community of 3,000+ doctors.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Page>

      {/* 3. PILLARS PAGE */}
      <Page index={2} total={4} bgColor="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-md">
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-brand-gold mb-4">Core Strengths</h2>
                <h3 className="text-5xl font-black text-brand-dark tracking-tighter">Strategic Mastery.</h3>
            </div>
            <p className="text-slate-400 font-medium text-lg lg:max-w-xs border-l-2 border-slate-100 pl-6">
               The three pillars that ensure our students remain ahead of the curve.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Users />, title: "Expert Faculty", desc: "Practicing consultants from top Australian teaching hospitals." },
              { icon: <Award />, title: "Proven Track Record", desc: "Pass rates that double the national candidate average." },
              { icon: <Globe />, title: "Global Network", desc: "A connected ecosystem of medical excellence across 5 continents." }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 group hover:bg-brand-dark transition-all duration-500"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl mb-10 flex items-center justify-center text-brand-violet group-hover:bg-brand-violet group-hover:text-white transition-all">
                   {React.cloneElement(item.icon, { className: "w-8 h-8" })}
                </div>
                <h4 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-white transition-colors">{item.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed group-hover:text-slate-400 transition-colors">{item.desc}</p>
                <div className="mt-8 pt-8 border-t border-slate-200/50 group-hover:border-white/10">
                   <Plus className="text-slate-300 group-hover:text-brand-gold transition-colors w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Page>

      {/* 4. FOOTER PAGE */}
      <Page index={3} total={4} bgColor="bg-brand-dark">
        {/* Abstract Background for Footer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-violet/20 rounded-full blur-[160px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Sparkles className="w-16 h-16 text-brand-gold mx-auto mb-12" />
            <h2 className="text-7xl md:text-[12vw] font-black text-white tracking-tighter leading-none mb-16">
               Be the <br /> 
               <span className="text-brand-gold italic">Catalyst.</span>
            </h2>
            <button className="px-12 py-6 rounded-full bg-white text-brand-dark font-black uppercase tracking-[0.2em] text-sm hover:bg-brand-gold hover:text-white transition-all duration-300 shadow-2xl">
                Get Started Now
            </button>
            <div className="mt-24 flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.6em] text-white/20">
               <span>Excellence</span>
               <span>Integrity</span>
               <span>Mastery</span>
            </div>
          </motion.div>
        </div>
      </Page>

    </div>
  );
};