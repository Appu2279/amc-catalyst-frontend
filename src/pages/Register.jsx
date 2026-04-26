import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, ShieldCheck, Mail, User, Lock, Sparkles } from 'lucide-react';
import { registerUser } from '@/api/userService';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser({ fullName: name, email, password });
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-brand-gold/10">
      
      {/* 1. Left Panel: High-Yield Branding */}
      <div className="lg:w-[40%] bg-slate-50 border-r border-slate-100 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 [background:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
            <Stethoscope className="w-6 h-6 text-brand-violet transition-transform group-hover:rotate-12" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-dark">AMC Catalyst</span>
          </Link>
          
          <h1 className="text-5xl md:text-7xl font-black text-brand-dark leading-[0.95] tracking-tighter mb-8">
            The Next <br />
            <span className="text-gradient-brand">Chapter.</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
            You are one step away from joining the most structured AMC preparation network in the world.
          </p>
        </motion.div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 py-6 border-t border-slate-200">
            <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                Accredited Curriculum <br /> 
                <span className="text-brand-dark">For Global Doctors</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Right Panel: Simplified Professional Form */}
      <div className="flex-1 bg-white p-8 lg:p-24 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <h2 className="text-2xl font-black text-brand-dark tracking-tight">Create your account</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Already a member?{' '}
              <Link to="/login" className="text-brand-violet hover:underline font-bold">Sign in here</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Field: Full Name */}
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-violet transition-colors">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-violet transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/5 outline-none transition-all text-sm font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Field: Email */}
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-violet transition-colors">
                Professional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-violet transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="sarah.j@medical.com"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/5 outline-none transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-violet transition-colors">
                Account Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-violet transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/5 outline-none transition-all text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-start gap-3 px-1 pt-2">
                <input 
                    type="checkbox" 
                    required 
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-brand-violet cursor-pointer" 
                />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    I agree to the <a href="#" className="text-brand-dark font-bold hover:text-brand-violet transition-colors">Terms of Service</a> and acknowledge the <a href="#" className="text-brand-dark font-bold hover:text-brand-violet transition-colors">Privacy Policy</a>.
                </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full py-5 bg-brand-dark hover:bg-brand-violet text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-dark/10 transition-all"
              >
                Create Account <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secured Enrollment Portal</span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};