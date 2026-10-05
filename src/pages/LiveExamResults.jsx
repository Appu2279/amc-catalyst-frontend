import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, ArrowRight, Medal, Users, CalendarDays } from 'lucide-react';
import { getPublishedResults, getPublicResults } from '@/api/liveExamService';
import { StatTile, ScoreDistribution, DomainBars } from '@/components/liveExam/ResultParts';
import { fmtDate, errorMessage } from '@/components/liveExam/format';
import { useAuth } from '@/context/AuthContext';

// Public pages, outside the dashboard: anyone can see published results.

const flag = (code) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';

const Shell = ({ children }) => (
  <div className="pt-28 pb-16 px-4">
    <div className="max-w-5xl mx-auto">{children}</div>
  </div>
);

/** /results — every exam whose results are public. */
export const LiveExamResultsIndex = () => {
  const [exams, setExams] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublishedResults()
      .then((res) => setExams(res.data ?? []))
      .catch((err) => setError(errorMessage(err, 'Could not load results.')));
  }, []);

  return (
    <Shell>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Exam Results</h1>
      <p className="text-slate-500 mt-2">Results of AMC Catalyst live exams.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {exams === null && !error && <p className="text-sm text-slate-400">Loading…</p>}
        {exams?.length === 0 && <p className="text-sm text-slate-400">No results have been published yet.</p>}
        {exams?.map((e) => (
          <Link key={e.slug} to={`/results/${e.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-violet-300 hover:shadow-md transition">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">{e.title}</h2>
            <p className="text-sm text-slate-500 mt-1">Held {fmtDate(e.opens_at)} · {e.total_questions} questions</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-violet">
              View results <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Shell>
  );
};

const RankBadge = ({ rank }) => {
  const tone = { 1: 'text-amber-500', 2: 'text-slate-400', 3: 'text-orange-500' }[rank];
  return tone
    ? <span className="inline-flex items-center gap-1 font-bold text-slate-900"><Medal className={`w-4 h-4 ${tone}`} />{rank}</span>
    : <span className="font-semibold text-slate-600">{rank}</span>;
};

/** /results/:slug — one exam's public results. */
export const LiveExamPublicResults = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublicResults(slug)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.status === 404 ? 'These results are not available.' : errorMessage(err, 'Could not load results.')));
  }, [slug]);

  if (error) {
    return (
      <Shell>
        <p className="text-slate-600">{error}</p>
        <Link to="/results" className="text-sm font-semibold text-brand-violet mt-3 inline-block">All results</Link>
      </Shell>
    );
  }
  if (!data) return <Shell><p className="text-sm text-slate-400">Loading…</p></Shell>;

  const { exam, stats, domains, leaderboard } = data;
  return (
    <Shell>
      <Link to="/results" className="text-sm text-slate-500 hover:text-brand-violet">← All results</Link>
      <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-violet">
        <Trophy className="w-4 h-4" /> Official results
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">{exam.title}</h1>
      <p className="text-slate-500 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Held {fmtDate(exam.opens_at)}</span>
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {stats.candidates} candidates</span>
        <span>{exam.total_questions} questions · {exam.duration_minutes} min</span>
      </p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Candidates" value={stats.candidates} />
        <StatTile label="Average" value={`${stats.average_percent}%`} sub={`Median ${stats.median_percent}%`} />
        <StatTile label="Highest" value={`${stats.highest_percent}%`} sub={`${stats.highest_score} / ${exam.total_marks} marks`} />
        {stats.pass_rate != null
          ? <StatTile label="Pass rate" value={`${stats.pass_rate}%`} sub={`${stats.pass_count} passed · pass mark ${exam.pass_percent}%`} />
          : <StatTile label="Questions" value={exam.total_questions} sub={`${exam.total_marks} marks`} />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Score distribution</h2>
          <ScoreDistribution distribution={stats.distribution} />
        </div>
        {domains.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Average by domain</h2>
            <DomainBars rows={domains.map((d) => ({ key: d.key, label: d.label, value: d.average_percent, detail: `${d.questions} Qs` }))} />
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 sm:px-6 pt-5">Top {leaderboard.length}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-200">
                  <th className="text-left font-medium px-5 sm:px-6 py-2 w-16">Rank</th>
                  <th className="text-left font-medium px-2 py-2">Candidate</th>
                  <th className="text-right font-medium px-2 py-2">Score</th>
                  <th className="text-right font-medium px-5 sm:px-6 py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 sm:px-6 py-2.5"><RankBadge rank={row.rank} /></td>
                    <td className="px-2 py-2.5 text-slate-800">
                      {flag(row.country)} {row.name ?? `Candidate #${row.rank}`}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">{row.score}</td>
                    <td className="px-5 sm:px-6 py-2.5 text-right tabular-nums font-semibold text-slate-900">{row.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-violet-50 border border-violet-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-700">
          {isAuthenticated ? 'Sat this exam? Your personal breakdown is in your dashboard.' : 'Sat this exam? Log in to see your personal breakdown.'}
        </p>
        <Link
          to={isAuthenticated ? '/live-exam' : '/login?next=/live-exam'}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-violet px-4 py-2 text-sm font-bold text-white hover:bg-brand-violet-hover"
        >
          {isAuthenticated ? 'My result' : 'Log in'} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Shell>
  );
};
