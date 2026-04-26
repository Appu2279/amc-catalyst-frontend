import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Fingerprint, Lock, Mail, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/userService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ email, password });
      const { user, token } = response.data;
      login(user, token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-brand-violet/10">
      
      {/* --- Left Side: Aesthetic Branding (Visible on MD+) --- */}
      <div className="hidden md:flex md:w-1/2 bg-slate-50 relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
        {/* Subtle Decorative Grid */}
        <div className="absolute inset-0 [background:radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
        
        <div className="relative z-10 max-w-sm text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center mx-auto mb-8 border border-slate-100"
          >
            <Stethoscope className="w-10 h-10 text-brand-violet" />
          </motion.div>
          <h1 className="text-3xl font-black text-brand-dark mb-4 tracking-tight">
            The Catalyst for <br />
            <span className="text-gradient-brand">Medical Excellence.</span>
          </h1>
          <p className="text-slate-500 leading-relaxed font-medium">
            Join thousands of doctors mastering the AMC through our high-yield structured programs.
          </p>
          
          <div className="mt-12 flex items-center justify-center gap-4 text-xs font-bold text-brand-gold uppercase tracking-[0.2em]">
            <span className="w-8 h-[1px] bg-brand-gold/30"></span>
            Premium Medical Education
            <span className="w-8 h-[1px] bg-brand-gold/30"></span>
          </div>
        </div>
      </div>

      {/* --- Right Side: Clean Login Form --- */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative">
        
        {/* Top Navigation */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-brand-dark transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <Link to="/register" className="text-xs font-bold text-brand-violet border-b-2 border-brand-violet/10 hover:border-brand-violet transition-all pb-1 uppercase tracking-widest">
            Create Account
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="mb-10">
            <h2 className="text-4xl font-black text-brand-dark tracking-tighter mb-2">Sign In</h2>
            <p className="text-slate-400 font-medium">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 group-focus-within:text-brand-violet transition-colors">
                  Professional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-violet transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full bg-transparent border-b-2 border-slate-100 py-3 pl-8 focus:outline-none focus:border-brand-violet transition-all text-brand-dark font-medium placeholder:text-slate-200"
                    placeholder="dr.smith@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group pt-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-focus-within:text-brand-violet transition-colors">
                    Secure Password
                  </label>
                  <a href="#" className="text-[10px] font-bold text-slate-300 hover:text-brand-gold uppercase tracking-widest">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-violet transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full bg-transparent border-b-2 border-slate-100 py-3 pl-8 focus:outline-none focus:border-brand-violet transition-all text-brand-dark font-medium placeholder:text-slate-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:bg-brand-violet transition-all"
              >
                Access Dashboard <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-8 text-slate-300">
              <Fingerprint className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Healthcare Portal</span>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};