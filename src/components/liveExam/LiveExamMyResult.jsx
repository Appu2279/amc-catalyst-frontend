import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { getMyLiveExamResult } from '@/api/liveExamService';
import { StatTile, DomainBars, ReviewList } from '@/components/liveExam/ResultParts';
import { fmtDuration, errorMessage } from '@/components/liveExam/format';

/** A student's own published result: score, standing, domain breakdown and (if allowed) review. */
export const LiveExamMyResult = ({ examId, slug }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyLiveExamResult(examId)
      .then((res) => setResult(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load your result.')));
  }, [examId]);

  if (error) return <p className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</p>;
  if (!result) return <div className="p-16 text-center text-sm text-slate-400">Loading your result…</div>;

  const { me, exam, domains } = result;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80"><Trophy className="w-4 h-4" /> Your result</div>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-5xl font-black tabular-nums">{me.percent}%</p>
          <p className="text-white/90 pb-1">
            {me.score} / {exam.total_marks} marks
            {me.passed != null && (
              <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold ${me.passed ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'}`}>
                {me.passed ? 'PASS' : 'Below pass mark'}
              </span>
            )}
          </p>
        </div>
        {me.rank != null && (
          <p className="mt-3 text-white/90">
            Rank <strong>{me.rank}</strong> of {me.candidates}
            {me.percentile != null && <> · better than <strong>{me.percentile}%</strong> of candidates</>}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Correct" value={me.total_correct} />
        <StatTile label="Wrong" value={me.total_wrong} />
        <StatTile label="Not answered" value={me.total_unanswered} />
        <StatTile label="Time taken" value={fmtDuration(me.time_taken_seconds)} />
      </div>

      {domains.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="font-semibold text-slate-900 mb-4">By domain</h3>
          <DomainBars
            valueLabel="You"
            markerLabel="All candidates (average)"
            rows={domains.map((d) => ({
              key: d.key, label: d.label, value: d.percent, marker: d.cohort_average_percent,
              detail: `${d.correct}/${d.total}`,
            }))}
          />
        </div>
      )}

      {exam.public_results && (
        <Link to={`/results/${slug}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-violet-300 transition-colors">
          <span className="text-sm font-semibold text-slate-800">See the full results and leaderboard</span>
          <ArrowRight className="w-4 h-4 text-brand-violet" />
        </Link>
      )}

      {result.review && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Review your answers</h3>
          <ReviewList questions={result.review} />
        </div>
      )}
    </div>
  );
};
