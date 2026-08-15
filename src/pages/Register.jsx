import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, ArrowRight, ShieldCheck, Mail, User, Lock, Sparkles,
  Briefcase, Globe, GraduationCap, ChevronDown,
} from 'lucide-react';
import { registerUser } from '@/api/userService';
import { Toast } from '@/components/ui/Toast';
import {
  PROFESSIONAL_ROLES,
  COUNTRIES,
  GRADUATION_YEAR_MIN,
  graduationYearMax,
} from '@/constants/registration';

// Newest first — most registrants graduated recently or are about to.
const GRADUATION_YEARS = Array.from(
  { length: graduationYearMax() - GRADUATION_YEAR_MIN + 1 },
  (_, i) => graduationYearMax() - i
);

const fieldClass =
  'w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/5 outline-none transition-all text-sm font-medium';

const labelClass =
  'text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-violet transition-colors';

const iconClass =
  'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-violet transition-colors pointer-events-none';

export const Register = () => {
  const [name, setName]                         = useState('');
  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [professionalRole, setProfessionalRole] = useState('');
  const [country, setCountry]                   = useState('');
  const [graduationYear, setGraduationYear]     = useState('');
  const [loading, setLoading]                   = useState(false);
  const [toast, setToast]                       = useState(null);

  const navigate = useNavigate();

  const showToast = (type, message) => setToast({ type, message });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('error', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      showToast('error', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }
    if (!professionalRole) {
      showToast('error', 'Please select your current role.');
      return;
    }
    if (!country) {
      showToast('error', 'Please select your country.');
      return;
    }
    if (!graduationYear) {
      showToast('error', 'Please select your year of graduation.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        fullName: name.trim(),
        email: email.trim(),
        password,
        professionalRole,
        country,
        graduationYear: Number(graduationYear),
      });
      // replace: the form is done, so back should not return to a filled-in copy of it.
      navigate('/registration-success', {
        replace: true,
        state: { fullName: name.trim(), email: email.trim() },
      });
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 409 || (status === 400 && message?.toLowerCase().includes('exist'))) {
        showToast('error', 'An account with this email already exists.');
      } else if (status === 400) {
        showToast('error', message || 'Invalid details. Please check your inputs.');
      } else if (!navigator.onLine) {
        showToast('error', 'You appear to be offline. Check your connection.');
      } else {
        showToast('error', message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-brand-gold/10">

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Left Panel: Branding */}
      <div className="lg:w-[40%] bg-slate-50 border-r border-slate-100 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden">
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

      {/* Right Panel: Form */}
      <div className="flex-1 bg-white p-8 lg:p-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <h2 className="text-2xl font-black text-brand-dark tracking-tight">Create your account</h2>
            {/* Pre-registration launch: sign-in is hidden until the dashboard opens.
                Restore this line when accounts go live. */}
            {/*
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Already a member?{' '}
              <Link to="/login" className="text-brand-violet hover:underline font-bold">Sign in here</Link>
            </p>
            */}
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Reserve your place before launch — we will open your dashboard as soon as we go live.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Full Name */}
            <div className="group space-y-2">
              <label className={labelClass}>Full Legal Name</label>
              <div className="relative">
                <User className={iconClass} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="group space-y-2">
              <label className={labelClass}>Professional Email</label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  type="email"
                  required
                  placeholder="sarah.j@medical.com"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="group space-y-2">
              <label className={labelClass}>Account Passkey</label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className={fieldClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-300 ml-1">Minimum 6 characters</p>
            </div>

            {/* Current Role */}
            <div className="group space-y-2">
              <label className={labelClass}>Current Role</label>
              <div className="relative">
                <Briefcase className={iconClass} />
                <select
                  required
                  className={`${fieldClass} appearance-none pr-11 cursor-pointer ${professionalRole ? 'text-brand-dark' : 'text-slate-400'}`}
                  value={professionalRole}
                  onChange={(e) => setProfessionalRole(e.target.value)}
                >
                  <option value="" disabled>Select your role</option>
                  {PROFESSIONAL_ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="text-brand-dark">
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Country + Year of Graduation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group space-y-2">
                <label className={labelClass}>Country</label>
                <div className="relative">
                  <Globe className={iconClass} />
                  <select
                    required
                    className={`${fieldClass} appearance-none pr-11 cursor-pointer ${country ? 'text-brand-dark' : 'text-slate-400'}`}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="" disabled>Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="text-brand-dark">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                </div>
              </div>

              <div className="group space-y-2">
                <label className={labelClass}>Year of Graduation</label>
                <div className="relative">
                  <GraduationCap className={iconClass} />
                  <select
                    required
                    className={`${fieldClass} appearance-none pr-11 cursor-pointer ${graduationYear ? 'text-brand-dark' : 'text-slate-400'}`}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                  >
                    <option value="" disabled>Select year</option>
                    {GRADUATION_YEARS.map((y) => (
                      <option key={y} value={y} className="text-brand-dark">
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-300 ml-1 -mt-4">
              Expected year is fine if you have not graduated yet.
            </p>

            {/* Privacy Checkbox */}
            <div className="flex items-start gap-3 px-1 pt-2">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-brand-violet cursor-pointer"
              />
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                I agree to the{' '}
                <a href="#" className="text-brand-dark font-bold hover:text-brand-violet transition-colors">Terms of Service</a>
                {' '}and acknowledge the{' '}
                <a href="#" className="text-brand-dark font-bold hover:text-brand-violet transition-colors">Privacy Policy</a>.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-brand-dark hover:bg-brand-violet text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-dark/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-5 h-5" />
                  </>
                )}
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
