import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

// ── Sub-components ─────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

const EmptyState = ({ icon: Icon, text, action }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">{text}</p>
    {action && (
      <Link to={action.to} className="mt-3 text-xs font-medium text-violet-600 hover:underline">
        {action.label}
      </Link>
    )}
  </div>
);

const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, loading }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
    {loading ? (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    ) : (
      <>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </>
    )}
  </div>
);

const SubjectBar = ({ name, accuracy, total, correct }) => {
  const pct = Math.min(100, parseFloat(accuracy) || 0);
  const [color, textColor, trackColor] =
    pct >= 70
      ? ['bg-emerald-500', 'text-emerald-600', 'bg-emerald-50']
      : pct >= 50
      ? ['bg-amber-400',   'text-amber-600',   'bg-amber-50']
      : ['bg-red-400',     'text-red-500',     'bg-red-50'];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-sm font-medium text-slate-700 truncate flex-1">{name}</span>
        <span className={`text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${textColor} ${trackColor}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">
        {correct} correct of {total} answered
      </p>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const Dashboard = () => {
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

  // Sort subjects best → worst for display
  const sortedSubjects = [...subjects].sort(
    (a, b) => parseFloat(b.accuracy_percent) - parseFloat(a.accuracy_percent)
  );

  return (
    <DashboardLayout active="dashboard">
      <div className="p-5 sm:p-8 space-y-7 pb-20 md:pb-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting}, Dr. {firstName} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-AU', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <Link
            to="/mock-exam"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Trophy className="w-4 h-4" />
            Start Mock Exam
          </Link>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            loading={loading}
            icon={BookOpen}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            label="Questions Answered"
            value={totalAnswered.toLocaleString()}
            sub="across all exams"
          />
          <StatCard
            loading={loading}
            icon={Target}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            label="Average Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            sub="correct vs attempted"
          />
          <StatCard
            loading={loading}
            icon={Trophy}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            label="Mock Exams Taken"
            value={totalAttempts.toString()}
            sub="completed attempts"
          />
          <StatCard
            loading={loading}
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            label="Average Score"
            value={avgScore.toFixed(1)}
            sub="marks per exam"
          />
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Subject Performance */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-slate-900">Subject Performance</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Mock exam results by subject</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />≥70%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />50–69%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt;50%
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
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : sortedSubjects.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  text="No subject data yet. Complete a mock exam to see your performance breakdown."
                  action={{ label: 'Take a mock exam', to: '/mock-exam' }}
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-slate-900">Recent Mock Exams</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your last 5 completed attempts</p>
                </div>
                <Link
                  to="/mock-exam"
                  className="text-xs text-violet-600 font-medium hover:underline flex items-center gap-0.5"
                >
                  All exams <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  text="No completed exams yet. Take your first mock exam to track your progress."
                  action={{ label: 'Browse exams', to: '/mock-exam' }}
                />
              ) : (
                <div className="space-y-2">
                  {history.map(a => {
                    const total   = a.mock_test?.total_questions ?? (Number(a.total_correct || 0) + Number(a.total_wrong || 0) + Number(a.total_unanswered || 0));
                    const correct = Number(a.total_correct ?? 0);
                    const pctNum  = total > 0 ? (correct / total) * 100 : null;
                    const pctStr  = pctNum !== null ? pctNum.toFixed(0) + '%' : '—';
                    const passed  = pctNum !== null && pctNum >= 50;

                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-violet-50/50 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {passed
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            : <XCircle      className="w-5 h-5 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {a.mock_test?.title ?? `Exam Attempt #${a.id}`}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(a.created_at).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {a.mock_test?.duration_minutes && (
                              <span className="ml-1">· {a.mock_test.duration_minutes} min</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums text-slate-900">
                            {correct}/{total}
                          </p>
                          <p className={`text-xs font-semibold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                            {pctStr}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">

            {/* Focus Areas (weak topics) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-slate-900">Focus Areas</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Topics with lowest accuracy (≥5 attempts)
              </p>

              {loading ? (
                <div className="space-y-2.5 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : weakTopics.length === 0 ? (
                <EmptyState
                  icon={Target}
                  text="No focus areas found yet. Needs at least 5 answers per topic."
                />
              ) : (
                <div className="space-y-2">
                  {weakTopics.slice(0, 6).map(t => {
                    const pct = parseFloat(t.accuracy_percent) || 0;
                    const [bg, text] = pct < 40
                      ? ['bg-red-50',  'text-red-600']
                      : ['bg-amber-50', 'text-amber-600'];
                    return (
                      <div
                        key={t.topic_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 truncate leading-snug">
                            {t.topic_name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{t.subject_name}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${bg} ${text}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Practice */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Quick Practice</h2>
              <div className="space-y-1.5">
                {[
                  {
                    to: '/qbank',
                    icon: BookOpen,
                    iconColor: 'text-violet-600',
                    iconBg: 'bg-violet-50',
                    hoverBg: 'hover:bg-violet-50',
                    arrowHover: 'group-hover:text-violet-400',
                    label: 'QBank',
                    sub: 'Practice by topic',
                  },
                  {
                    to: '/recall',
                    icon: UndoDot,
                    iconColor: 'text-blue-600',
                    iconBg: 'bg-blue-50',
                    hoverBg: 'hover:bg-blue-50',
                    arrowHover: 'group-hover:text-blue-400',
                    label: 'Recall',
                    sub: 'Memory-based questions',
                  },
                  {
                    to: '/mock-exam',
                    icon: Trophy,
                    iconColor: 'text-amber-600',
                    iconBg: 'bg-amber-50',
                    hoverBg: 'hover:bg-amber-50',
                    arrowHover: 'group-hover:text-amber-400',
                    label: 'Mock Exam',
                    sub: tests.length > 0
                      ? `${tests.length} exam${tests.length !== 1 ? 's' : ''} available`
                      : 'Timed full-length exam',
                  },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 p-3 rounded-xl ${item.hoverBg} group transition-colors`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.sub}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 ${item.arrowHover} transition-colors shrink-0`} />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
