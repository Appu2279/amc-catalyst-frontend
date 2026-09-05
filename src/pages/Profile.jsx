import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Briefcase, Globe, GraduationCap, ChevronDown, Lock,
  Save, Loader2, Camera, Trash2, ShieldCheck, RotateCcw, Check,
  Crown, CalendarDays, ArrowRight, Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { Toast } from '@/components/ui/Toast';
import {
  getMyProfile, updateMyProfile, uploadMyAvatar, deleteMyAvatar,
} from '@/api/userService';
import {
  PROFESSIONAL_ROLES,
  COUNTRIES,
  GRADUATION_YEAR_MIN,
  graduationYearMax,
  professionalRoleLabel,
  countryName,
} from '@/constants/registration';

// Newest first — most students graduated recently or are about to.
const GRADUATION_YEARS = Array.from(
  { length: graduationYearMax() - GRADUATION_YEAR_MIN + 1 },
  (_, i) => graduationYearMax() - i
);

const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

const fieldClass =
  'w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10 outline-none transition-all text-sm font-medium text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass =
  'text-[11px] font-black text-slate-600 uppercase tracking-wider ml-1 group-focus-within:text-brand-violet transition-colors';
const iconClass =
  'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-violet transition-colors pointer-events-none';

const emptyForm = {
  fullName: '',
  email: '',
  professionalRole: '',
  country: '',
  graduationYear: '',
};

const Card = ({ title, subtitle, icon: Icon, children }) => (
  <section className="bg-white rounded-3xl border border-slate-200 shadow-sm ring-1 ring-slate-900/[0.04] p-6 sm:p-8">
    <div className="flex items-start gap-3.5 mb-6">
      {Icon && (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-violet/12 to-indigo-500/12 border border-brand-violet/20 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-brand-violet" />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-base font-black text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Field = ({ label, icon: Icon, children, hint }) => (
  <div className="group space-y-2">
    <label className={labelClass}>{label}</label>
    <div className="relative">
      <Icon className={iconClass} />
      {children}
    </div>
    {hint && <p className="text-[10px] font-medium text-slate-400 ml-1">{hint}</p>}
  </div>
);

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const SECTION_LABELS = {
  notes: 'Study Notes',
  qbank: 'QBank',
  recall: 'Recalls',
  mocks: 'Mock Exams',
};

const MembershipCard = () => {
  const { subscriptions, loading } = useAccess();

  if (loading) {
    return (
      <Card title="Membership" subtitle="Your plan and how long it runs." icon={Crown}>
        <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
      </Card>
    );
  }

  if (!subscriptions.length) {
    return (
      <Card title="Membership" subtitle="Your plan and how long it runs." icon={Crown}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white px-5 py-4">
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
            <div>
              <p className="text-sm font-bold">No active plan</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlock notes, MCQs, recalls and full-length mock exams.
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-violet transition hover:bg-white/90"
          >
            See plans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>
    );
  }

  const sorted = [...subscriptions].sort((a, b) => a.days_remaining - b.days_remaining);

  return (
    <Card icon={Crown} title="Membership" subtitle={`${subscriptions.length} active plan${subscriptions.length > 1 ? 's' : ''}.`}>
      <div className="space-y-3">
        {sorted.map((s) => {
          const expiringSoon = s.days_remaining <= 14;
          return (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-violet/10 flex items-center justify-center shrink-0">
                    <Crown className="w-4.5 h-4.5 text-brand-violet" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{s.plan_title ?? 'Your plan'}</p>
                    <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays className="w-3 h-3" />
                      {fmtDate(s.start_date)} — {fmtDate(s.end_date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                    expiringSoon
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {s.days_remaining} {s.days_remaining === 1 ? 'day' : 'days'} left
                </span>
              </div>

              {Array.isArray(s.sections) && s.sections.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.sections.map((key) => (
                    <span
                      key={key}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500"
                    >
                      {SECTION_LABELS[key] ?? key}
                    </span>
                  ))}
                </div>
              )}

              {expiringSoon && (
                <Link
                  to="/pricing"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-violet hover:underline"
                >
                  Renew plan <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const Profile = () => {
  const { user, updateUser, avatarUrl, refreshAvatar } = useAuth();

  const [form, setForm]       = useState(emptyForm);
  const [initial, setInitial] = useState(emptyForm);
  const [pw, setPw]           = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const fileInput = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [preview, setPreview]       = useState(null); // local object URL while a new picture uploads

  const showToast = (type, message) => setToast({ type, message });

  const seed = (u) => {
    const next = {
      fullName:         u.fullName ?? '',
      email:            u.email ?? '',
      professionalRole: u.professionalRole ?? '',
      country:          u.country ?? '',
      graduationYear:   u.graduationYear != null ? String(u.graduationYear) : '',
    };
    setForm(next);
    setInitial(next);
  };

  useEffect(() => {
    if (user) seed(user);
    getMyProfile()
      .then((res) => {
        const fresh = res.data?.user ?? res.data;
        if (fresh) {
          seed(fresh);
          updateUser(fresh);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop the local preview once the context avatar has caught up.
  useEffect(() => {
    if (preview) {
      const t = setTimeout(() => {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [avatarUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPassword = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }));

  const changedFields = useMemo(() => {
    const diff = {};
    for (const key of Object.keys(emptyForm)) {
      if (form[key] !== initial[key]) diff[key] = form[key];
    }
    return diff;
  }, [form, initial]);

  const wantsPasswordChange = pw.newPassword.length > 0 || pw.currentPassword.length > 0;
  const isDirty = Object.keys(changedFields).length > 0 || wantsPasswordChange;

  const resetForm = () => {
    setForm(initial);
    setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const pickFile = () => fileInput.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be chosen again after a failure
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return showToast('error', 'Please choose an image file.');
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return showToast('error', 'Image must be smaller than 3MB.');
    }

    setPreview(URL.createObjectURL(file));
    setAvatarBusy(true);
    try {
      const res = await uploadMyAvatar(file);
      const updated = res.data?.user ?? res.data;
      if (updated) updateUser(updated);
      else updateUser({ hasAvatar: true });
      refreshAvatar();
      showToast('success', 'Profile picture updated.');
    } catch (err) {
      setPreview(null);
      const message = err?.response?.data?.message;
      showToast('error', message || 'Could not upload that image. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    try {
      const res = await deleteMyAvatar();
      const updated = res.data?.user ?? res.data;
      if (updated) updateUser(updated);
      else updateUser({ hasAvatar: false });
      setPreview(null);
      refreshAvatar();
      showToast('success', 'Profile picture removed.');
    } catch (err) {
      const message = err?.response?.data?.message;
      showToast('error', message || 'Could not remove the picture. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim())  return showToast('error', 'Please enter your full name.');
    if (!form.email.trim())     return showToast('error', 'Please enter your email address.');
    if (!form.professionalRole) return showToast('error', 'Please select your current role.');
    if (!form.country)          return showToast('error', 'Please select your country.');
    if (!form.graduationYear)   return showToast('error', 'Please select your year of graduation.');

    const payload = { ...changedFields };
    if (payload.graduationYear !== undefined) payload.graduationYear = Number(payload.graduationYear);

    if (wantsPasswordChange) {
      if (pw.newPassword.length < 6) return showToast('error', 'New password must be at least 6 characters.');
      if (pw.newPassword !== pw.confirmPassword) return showToast('error', 'New passwords do not match.');
      if (!pw.currentPassword) return showToast('error', 'Enter your current password to set a new one.');
      payload.currentPassword = pw.currentPassword;
      payload.newPassword = pw.newPassword;
    }

    if (Object.keys(payload).length === 0) return showToast('error', 'Nothing has changed yet.');

    setSaving(true);
    try {
      const res = await updateMyProfile(payload);
      const updated = res.data?.user ?? res.data;
      if (updated) {
        seed(updated);
        updateUser(updated);
      }
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Profile updated.');
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 409) showToast('error', 'An account with this email already exists.');
      else if (status === 400) showToast('error', message || 'Please check your inputs and try again.');
      else if (!navigator.onLine) showToast('error', 'You appear to be offline. Check your connection.');
      else showToast('error', message || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shownAvatar = preview || avatarUrl;
  const initialLetter = (form.fullName || user?.fullName || 'D').trim().charAt(0).toUpperCase() || 'D';
  const displayName   = form.fullName || user?.fullName || 'Your profile';
  const roleLabel     = professionalRoleLabel(form.professionalRole);
  const memberSince   = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    : null;

  return (
    <DashboardLayout active="profile">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* A faint wash of the hero's colour bleeding down the page, plus a dot
          grid — otherwise everything below the dark hero reads as flat grey. */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-100/60 via-indigo-50/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="relative p-4 sm:p-8 max-w-3xl mx-auto space-y-6 pb-32 md:pb-28">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl"
        >
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-brand-violet/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/4 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/15 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                {shownAvatar ? (
                  <img src={shownAvatar} alt="Your profile picture" draggable={false} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white/90">{initialLetter}</span>
                )}
              </div>

              {avatarBusy && (
                <div className="absolute inset-0 rounded-3xl bg-slate-950/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}

              <button
                type="button"
                onClick={pickFile}
                disabled={avatarBusy}
                title="Change profile picture"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-white text-slate-900 shadow-lg flex items-center justify-center hover:bg-brand-violet hover:text-white transition disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{displayName}</h1>
              <p className="text-slate-300 text-sm font-medium mt-1 truncate">{form.email || user?.email}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {roleLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300">
                    <Briefcase className="w-3 h-3" /> {roleLabel}
                  </span>
                )}
                {form.country && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-slate-200">
                    <Globe className="w-3 h-3" /> {countryName(form.country)}
                  </span>
                )}
                {memberSince && (
                  <span className="text-[11px] font-medium text-slate-400">Member since {memberSince}</span>
                )}
              </div>

              <div className="mt-3.5 flex items-center justify-center sm:justify-start gap-3 text-[11px] font-medium">
                {shownAvatar ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarBusy}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-300 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove photo
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Camera className="w-3.5 h-3.5" /> Tap the camera to add a photo
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Membership ────────────────────────────────────────────────────── */}
        <MembershipCard />

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Personal information ─────────────────────────────────────── */}
            <Card title="Personal information" subtitle="The details you gave when you registered." icon={User}>
              <div className="space-y-6">
                <Field label="Full Legal Name" icon={User}>
                  <input
                    type="text"
                    className={fieldClass}
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="e.g. Dr. Sarah Jenkins"
                  />
                </Field>

                <Field label="Current Role" icon={Briefcase}>
                  <select
                    className={`${fieldClass} appearance-none pr-11 cursor-pointer ${form.professionalRole ? 'text-slate-900' : 'text-slate-400'}`}
                    value={form.professionalRole}
                    onChange={set('professionalRole')}
                  >
                    <option value="" disabled>Select your role</option>
                    {PROFESSIONAL_ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="text-slate-900">{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Country" icon={Globe}>
                    <select
                      className={`${fieldClass} appearance-none pr-11 cursor-pointer ${form.country ? 'text-slate-900' : 'text-slate-400'}`}
                      value={form.country}
                      onChange={set('country')}
                    >
                      <option value="" disabled>Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="text-slate-900">{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </Field>

                  <Field label="Year of Graduation" icon={GraduationCap} hint="Expected year is fine.">
                    <select
                      className={`${fieldClass} appearance-none pr-11 cursor-pointer ${form.graduationYear ? 'text-slate-900' : 'text-slate-400'}`}
                      value={form.graduationYear}
                      onChange={set('graduationYear')}
                    >
                      <option value="" disabled>Select year</option>
                      {GRADUATION_YEARS.map((y) => (
                        <option key={y} value={y} className="text-slate-900">{y}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </Field>
                </div>
              </div>
            </Card>

            {/* ── Account & security ───────────────────────────────────────── */}
            <Card title="Account & security" subtitle="Your sign-in email and password." icon={ShieldCheck}>
              <div className="space-y-6">
                <Field label="Professional Email" icon={Mail}>
                  <input
                    type="email"
                    className={fieldClass}
                    value={form.email}
                    onChange={set('email')}
                    placeholder="sarah.j@medical.com"
                  />
                </Field>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mt-4 mb-4 ml-1">
                    Change password <span className="text-slate-400 normal-case tracking-normal font-semibold">— leave blank to keep your current one</span>
                  </p>

                  <div className="space-y-6">
                    <Field label="Current Password" icon={Lock}>
                      <input
                        type="password"
                        autoComplete="current-password"
                        className={fieldClass}
                        value={pw.currentPassword}
                        onChange={setPassword('currentPassword')}
                        placeholder="••••••••••••"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field label="New Password" icon={Lock} hint="Minimum 6 characters">
                        <input
                          type="password"
                          autoComplete="new-password"
                          className={fieldClass}
                          value={pw.newPassword}
                          onChange={setPassword('newPassword')}
                          placeholder="••••••••••••"
                        />
                      </Field>
                      <Field label="Confirm New Password" icon={Lock}>
                        <input
                          type="password"
                          autoComplete="new-password"
                          className={fieldClass}
                          value={pw.confirmPassword}
                          onChange={setPassword('confirmPassword')}
                          placeholder="••••••••••••"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-2 text-slate-300 px-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secured account portal</span>
            </div>

            {/* ── Sticky save bar ──────────────────────────────────────────── */}
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed inset-x-0 bottom-0 md:bottom-4 z-40 px-4 md:pl-64"
                >
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-300/40 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Unsaved changes
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-violet text-white text-xs font-bold shadow-lg shadow-brand-dark/20 transition disabled:opacity-50"
                      >
                        {saving
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                          : <><Save className="w-4 h-4" /> Save changes</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isDirty && (
              <p className="flex items-center gap-2 text-xs font-medium text-slate-400 px-1">
                <Check className="w-4 h-4 text-emerald-500" /> Everything is up to date.
              </p>
            )}
          </form>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};
