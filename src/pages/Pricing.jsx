import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Check, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCourses } from '../api/courseService';
export const Pricing = () => {
const [plans, setPlans] = useState([]);
 const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 100, damping: 12 } 
    }
  };
  useEffect(() => {
    const fetchPlans = async () => {
    try {
      const response = await getCourses();
      const sortedCourses = [...response.data].sort(
  (a, b) =>
    (a.CoursePricings?.[0]?.discounted_price || 0) -
    (b.CoursePricings?.[0]?.discounted_price || 0)
);
      setPlans(sortedCourses);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };
  fetchPlans();
  }, []);

  return (
 <div className="bg-white py-24 relative overflow-hidden">
      {/* Ultra-subtle background detail */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-violet to-brand-gold opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-brand-violet font-bold text-sm tracking-widest uppercase mb-3"
            >
              <Sparkles className="w-4 h-4" /> Catalyst Programs 2024
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
              Ready to <span className="text-gradient-brand">Master the AMC?</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium md:max-w-xs border-l-2 border-slate-100 pl-6">
            Compare our structured paths and secure your early bird advantage.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 gap-6">
          {plans.map((course, idx) => {
            const pricing = course.CoursePricings?.[0];
            const isEarlyBird = pricing?.is_early_bird;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${
                  isEarlyBird 
                  ? 'border-brand-violet/20 shadow-[0_20px_40px_rgba(124,58,237,0.08)]' 
                  : 'border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
              >
                {/* Early Bird Ribbon Tag */}
                {isEarlyBird && (
                  <div className="absolute top-0 right-0 overflow-hidden w-40 h-40 pointer-events-none">
                    <div className="absolute top-[30px] right-[-35px] rotate-45 bg-brand-gold text-white text-[10px] font-black py-1.5 w-[180px] text-center shadow-lg tracking-widest uppercase">
                      <Zap className="w-3 h-3 inline mr-1 fill-white" /> Early Bird Offer
                    </div>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                    
                    {/* Column 1: Core Info (Compact) */}
                    <div className="lg:w-1/3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                          isEarlyBird ? 'bg-brand-violet/10 text-brand-violet' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {course.duration_months} Months Access
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-brand-dark group-hover:text-brand-violet transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="mt-6 flex items-baseline gap-3">
                        <span className="text-4xl font-black text-brand-dark tracking-tighter">
                          ₹{pricing?.discounted_price}
                        </span>
                        {pricing?.actual_price !== pricing?.discounted_price && (
                          <span className="text-base text-slate-300 line-through">
                            ₹{pricing?.actual_price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Features (2-Column Grid to save space) */}
                    <div className="lg:w-5/12 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 border-t lg:border-t-0 lg:border-x border-slate-100 pt-6 lg:pt-0 lg:px-8">
                      {course.Features?.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2.5">
                          <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${
                            isEarlyBird ? 'bg-brand-violet/10 text-brand-violet' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[13px] font-medium text-slate-600 leading-tight">
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Column 3: Action & Benefits */}
                    <div className="lg:w-1/4 flex flex-col gap-4">
                      <button className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                        isEarlyBird 
                        ? 'bg-brand-violet text-white hover:bg-brand-violet-hover shadow-lg shadow-brand-violet/20' 
                        : 'bg-brand-dark text-white hover:bg-slate-800'
                      }`}>
                        Enroll Now <ArrowRight className="w-4 h-4" />
                      </button>
                      {course.Benefits?.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-gold/5 rounded-lg">
                          <ShieldCheck className="w-4 h-4 text-brand-gold" />
                          <span className="text-[11px] font-bold text-brand-gold uppercase tracking-tight">
                            {benefit.title}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Footer for Trust */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
            <Calendar className="w-4 h-4" /> Batch Starts Soon
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
            <Zap className="w-4 h-4" /> Instant Access
          </div>
        </div>
      </div>
    </div>
  );
};
