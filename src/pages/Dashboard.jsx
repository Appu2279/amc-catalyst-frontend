import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  getAnalyticsSummary,
  getSubjectPerformance,
  getWeakTopics,
  getAttemptHistory,
  getPublishedMockTests,
} from '@/api/userService';
import {
  BookOpen,
  Target,
  Trophy,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  UndoDot,
  Sparkles,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { PlanStatus } from '@/components/PlanStatus';

// ── Sub-components ─────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

const EmptyState = ({ icon: Icon, text, action }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-slate-100/80 flex items-center justify-center mb-3 text-slate-400">
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px]">{text}</p>
    {action && (
      <Link
        to={action.to}
        className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 transition"
      >
        {action.label} <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, loading, trend }) => (
  <motion.div
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
    className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex flex-col justify-between"
  >
    {loading ? (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shadow-xs`}>
            <Icon className={`w-5.5 h-5.5 ${iconColor}`} />
          </div>
          {trend && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" /> {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
            {value}
          </p>
          <p className="text-xs font-bold text-slate-700 mt-2">{label}</p>
          {sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
        </div>
      </>
    )}
  </motion.div>
);

const SubjectBar = ({ name, accuracy, total, correct }) => {
  const pct = Math.min(100, parseFloat(accuracy) || 0);
  const [color, textColor, trackColor, badgeBorder] =
    pct >= 70
      ? ['bg-emerald-500', 'text-emerald-700', 'bg-emerald-50', 'border-emerald-200']
      : pct >= 50
      ? ['bg-amber-400',   'text-amber-700',   'bg-amber-50',   'border-amber-200']
      : ['bg-red-400',     'text-red-600',     'bg-red-50',     'border-red-200'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{name}</span>
        <span className={`text-xs font-black tabular-nums shrink-0 px-2.5 py-0.5 rounded-full border ${textColor} ${trackColor} ${badgeBorder}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 shadow-xs`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] font-medium text-slate-400">
        {correct} correct of {total} answered
      </p>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { subscriptions, loading: accessLoading } = useAccess();
  const { user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [summary, setSummary]       = useState(null);
  const [subjects, setSubjects]     = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [history, setHistory]       = useState([]);
  const [tests, setTests]           = useState([]);

  useEffect(() => {
    Promise.allSettled([
      getAnalyticsSummary(),
      getSubjectPerformance(),
      getWeakTopics(),
      getAttemptHistory({ limit: 5 }),
      getPublishedMockTests(),
    ]).then(([s, subj, weak, hist, t]) => {
      if (s.status    === 'fulfilled') setSummary(s.value.data?.data    ?? s.value.data ?? null);
      if (subj.status === 'fulfilled') setSubjects(subj.value.data?.data ?? subj.value.data ?? []);
      if (weak.status === 'fulfilled') setWeakTopics(weak.value.data?.data ?? weak.value.data ?? []);
      if (hist.status === 'fulfilled') setHistory(hist.value.data?.data ?? []);
      if (t.status    === 'fulfilled') setTests(t.value.data?.data    ?? t.value.data ?? []);
      setLoading(false);
    });
  }, []);

  // Derived stats
  const totalAnswered = summary
    ? Number(summary.total_correct) + Number(summary.total_wrong)
    : 0;
  const avgAccuracy   = parseFloat(summary?.avg_accuracy ?? 0);
  const totalAttempts = Number(summary?.total_attempts ?? 0);
  const avgScore      = parseFloat(summary?.avg_score ?? 0);

  const firstName = user?.fullName?.split(' ')[0] ?? user?.name ?? 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const sortedSubjects = [...subjects].sort(
    (a, b) => parseFloat(b.accuracy_percent) - parseFloat(a.accuracy_percent)
  );

  return (
    <DashboardLayout active="dashboard">
      <div className="p-4 sm:p-8 space-y-7 pb-20 md:pb-8">

        {/* ── Modern Hero Header ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Dr. {firstName} • AMC Candidate
                </span>
                <span className="text-slate-400 text-xs font-semibold hidden sm:inline">•</span>
                <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                  {new Date().toLocaleDateString('en-AU', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {greeting}, Dr. {firstName} 👋
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1 max-w-xl">
                Welcome to your AMC CATALYST dashboard. Track your subject performance, review mock exams, and master high-yield topics.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/mock-exam"
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4" />
                <span>Start Mock Exam</span>
              </Link>
              <Link
                to="/notes"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold rounded-xl transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Study Notes</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Plan Access Status */}
        <PlanStatus subscriptions={subscriptions} loading={accessLoading} />

        {/* ── Stat cards grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            loading={loading}
            icon={BookOpen}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 border border-violet-100"
            label="Questions Answered"
            value={totalAnswered.toLocaleString()}
            sub="across all attempts"
          />
          <StatCard
            loading={loading}
            icon={Target}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 border border-emerald-100"
            label="Average Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            sub="correct vs attempted"
            trend={avgAccuracy > 0 ? `${avgAccuracy.toFixed(0)}%` : null}
          />
          <StatCard
            loading={loading}
            icon={Trophy}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 border border-amber-100"
            label="Mock Exams Taken"
            value={totalAttempts.toString()}
            sub="completed sessions"
          />
          <StatCard
            loading={loading}
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 border border-blue-100"
            label="Average Score"
            value={avgScore.toFixed(1)}
            sub="marks per exam"
          />
        </div>

        {/* ── Main content grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Subject Performance */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Subject Performance</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Mock exam accuracy broken down by clinical specialty</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />≥70% High
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />50–69% Mid
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />&lt;50% Low
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-5 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  ))}
                </div>
              ) : sortedSubjects.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  text="No subject data collected yet. Complete a mock exam to generate your accuracy breakdown."
                  action={{ label: 'Take a Mock Exam', to: '/mock-exam' }}
                />
              ) : (
                <div className="space-y-5">
                  {sortedSubjects.map(s => (
                    <SubjectBar
                      key={s.subject_id}
                      name={s.subject_name}
                      accuracy={s.accuracy_percent}
                      total={s.total_answered}
                      correct={s.total_correct}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Mock Exam History */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Recent Mock Exams</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Your last 5 completed exam attempts</p>
                </div>
                <Link
                  to="/mock-exam"
                  className="text-xs text-violet-600 font-bold hover:underline flex items-center gap-1"
                >
                  All Exams <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  text="No completed exam attempts recorded yet."
                  action={{ label: 'Browse Mock Exams', to: '/mock-exam' }}
                />
              ) : (
                <div className="space-y-2.5">
                  {history.map(a => {
                    const total   = a.mock_test?.total_questions ?? (Number(a.total_correct || 0) + Number(a.total_wrong || 0) + Number(a.total_unanswered || 0));
                    const correct = Number(a.total_correct ?? 0);
                    const pctNum  = total > 0 ? (correct / total) * 100 : null;
                    const pctStr  = pctNum !== null ? pctNum.toFixed(0) + '%' : '—';
                    const passed  = pctNum !== null && pctNum >= 50;

                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/40 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                          {passed
                            ? <CheckCircle2 className="w-5.5 h-5.5" />
                            : <XCircle      className="w-5.5 h-5.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {a.mock_test?.title ?? `Exam Attempt #${a.id}`}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(a.created_at).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {a.mock_test?.duration_minutes && (
                              <span className="text-slate-400">· {a.mock_test.duration_minutes} min</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black tabular-nums text-slate-900">
                            {correct}/{total}
                          </p>
                          <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {pctStr} {passed ? 'Passed' : 'Review'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column (1/3 width) */}
          <div className="space-y-6">

            {/* Focus Areas (Weak topics) */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                <h2 className="text-lg font-black text-slate-900">Focus Areas</h2>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-4">
                Topics requiring review (&lt;50% accuracy)
              </p>

              {loading ? (
                <div className="space-y-2.5 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
                </div>
              ) : weakTopics.length === 0 ? (
                <EmptyState
                  icon={Target}
                  text="No focus areas identified yet. Needs at least 5 answers per topic."
                />
              ) : (
                <div className="space-y-2.5">
                  {weakTopics.slice(0, 6).map(t => {
                    const pct = parseFloat(t.accuracy_percent) || 0;
                    const [bg, text, border] = pct < 40
                      ? ['bg-red-50',  'text-red-600', 'border-red-200']
                      : ['bg-amber-50', 'text-amber-700', 'border-amber-200'];
                    return (
                      <div
                        key={t.topic_id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                            {t.topic_name}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{t.subject_name}</p>
                        </div>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 border ${bg} ${text} ${border}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Practice Suite */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">Quick Practice Suite</h2>
              <div className="space-y-2">
                {[
                  {
                    to: '/notes',
                    icon: BookOpen,
                    iconColor: 'text-amber-600',
                    iconBg: 'bg-amber-50 border border-amber-200',
                    hoverBg: 'hover:bg-amber-50/50 hover:border-amber-200',
                    label: 'Study Notes',
                    sub: '22 High-Yield Notes Index',
                    badge: '22 Notes'
                  },
                  {
                    to: '/recall',
                    icon: UndoDot,
                    iconColor: 'text-blue-600',
                    iconBg: 'bg-blue-50 border border-blue-200',
                    hoverBg: 'hover:bg-blue-50/50 hover:border-blue-200',
                    label: 'Recall Questions',
                    sub: 'Memory-based exam recall',
                  },
                  {
                    to: '/mock-exam',
                    icon: Trophy,
                    iconColor: 'text-violet-600',
                    iconBg: 'bg-violet-50 border border-violet-200',
                    hoverBg: 'hover:bg-violet-50/50 hover:border-violet-200',
                    label: 'Mock Exam',
                    sub: tests.length > 0
                      ? `${tests.length} exam${tests.length !== 1 ? 's' : ''} available`
                      : 'Timed full-length exam',
                  },
                  {
                    to: '/qbank',
                    icon: BookOpen,
                    iconColor: 'text-slate-400',
                    iconBg: 'bg-slate-100 border border-slate-200',
                    hoverBg: '',
                    label: 'QBank (MCQs)',
                    sub: 'Subject-wise practice',
                    disabled: true,
                  },
                ].map(item => {
                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/80 opacity-75 cursor-not-allowed select-none"
                      >
                        <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{item.label}</p>
                          <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 ${item.hoverBg} group transition-all`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-violet-600 transition-colors">{item.label}</p>
                          {item.badge && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
