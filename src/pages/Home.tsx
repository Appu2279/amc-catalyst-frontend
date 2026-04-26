import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, PlayCircle, Star, Users, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Home = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div 
              className="lg:w-1/2 space-y-8 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
                </span>
                <span>#1 Platform for AMC Exams</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-violet">AMC Exam</span> with Confidence
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Comprehensive study materials, high-yield QBanks, and mock tests designed by top medical professionals to help you succeed in your Australian Medical Council exams.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">Start Free Trial</Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                    <PlayCircle className="w-5 h-5" /> Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src={`https://i.pravatar.cc/100?img=${10+i}`} alt="" />
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <div className="flex items-center gap-1 text-brand-gold">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p>Loved by 10,000+ doctors</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:w-1/2 relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl bg-white shadow-2xl shadow-brand-secondary/20 border border-slate-100 p-2">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                  alt="Medical Dashboard" 
                  className="rounded-xl w-full h-auto object-cover"
                />
                
                {/* Floating Card 1 */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce duration-[3000ms]">
                  <div className="bg-brand-gold/10 p-3 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Success Rate</p>
                    <p className="text-lg font-bold text-slate-900">98.5%</p>
                  </div>
                </div>

                 {/* Floating Card 2 */}
                 <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce duration-[4000ms]">
                  <div className="bg-brand-blue/10 p-3 rounded-full">
                    <Users className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Users</p>
                    <p className="text-lg font-bold text-slate-900">12k+</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Everything you need to pass</h2>
            <p className="text-lg text-slate-600">Our platform is designed to provide a comprehensive learning experience tailored for the AMC exams.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8 text-brand-secondary" />,
                title: "Comprehensive QBank",
                description: "Over 5,000 high-yield questions with detailed explanations and references."
              },
              {
                icon: <PlayCircle className="w-8 h-8 text-brand-secondary" />,
                title: "Video Lectures",
                description: "In-depth video lectures covering all major clinical topics and specialties."
              },
              {
                icon: <Award className="w-8 h-8 text-brand-secondary" />,
                title: "Mock Exams",
                description: "Simulate the real exam environment with timed mock tests and performance analysis."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-slate-100">
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-brand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">Ready to start your journey?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Join thousands of medical professionals who trust AMC Catalyst for their exam preparation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-brand-blue hover:bg-slate-50 shadow-none border-0 font-bold">
                Get Started Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
