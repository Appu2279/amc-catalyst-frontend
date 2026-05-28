import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getAttemptResult } from '@/api/userService';
import { Check, X, Minus, Clock, Trophy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const fmtTime = (s) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const MockExamResult = () => {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [result, setResult]       = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    getAttemptResult(attemptId)
      .then(res => setResult(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return (
    <DashboardLayout active="mock-exam">
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!result) return (
    <DashboardLayout active="mock-exam">
      <div className="text-center py-24 text-slate-400">Failed to load results.</div>
    </DashboardLayout>
  );

  const totalQ = result.attempt_questions?.length ?? 0;
  const pct    = totalQ > 0 ? Math.round((result.total_correct / totalQ) * 100) : 0;
  const pctColor = pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <DashboardLayout active="mock-exam">
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Score card ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-5">
              <Trophy className="w-10 h-10 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Test Complete!</h1>
            <p className="text-slate-400 text-sm mb-6">Here's how you did</p>

            {/* Big percentage */}
            <div className={`text-6xl font-bold mb-1 ${pctColor}`}>{pct}%</div>
            <p className="text-slate-400 text-sm mb-8">Score: {result.score} / {totalQ} marks</p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { Icon: Check,  label: 'Correct',  value: result.total_correct,    color: 'text-green-600', bg: 'bg-green-50'  },
                { Icon: X,      label: 'Wrong',    value: result.total_wrong,      color: 'text-red-500',   bg: 'bg-red-50'    },
                { Icon: Minus,  label: 'Skipped',  value: result.total_unanswered, color: 'text-slate-500', bg: 'bg-slate-100' },
                { Icon: Clock,  label: 'Time',     value: fmtTime(result.time_taken_seconds), color: 'text-slate-700', bg: 'bg-slate-100' },
              ].map(({ Icon, label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-4`}>
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/mock-exam')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Back to Exams
            </button>
          </div>

          {/* ── Question review ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Question Review</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click a question to see the explanation</p>
            </div>

            <div className="divide-y divide-slate-100">
              {(result.attempt_questions ?? []).map((aq, i) => {
                const userAnswer = aq.user_answer;
                const skipped    = !userAnswer;
                const correct    = userAnswer?.is_correct;

                // Options come from attempt result (admin-level — includes is_correct)
                const allOpts    = aq.question?.options ?? [];
                const correctOpt = allOpts.find(o => o.is_correct);
                const selectedOpt = allOpts.find(o => o.id === userAnswer?.selected_option_id);
                const isExpanded = expandedQ === i;

                return (
                  <div key={aq.id}>
                    <button
                      onClick={() => setExpandedQ(isExpanded ? null : i)}
                      className="w-full flex items-start gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      {/* Status dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        skipped  ? 'bg-slate-100'  :
                        correct  ? 'bg-green-500'  : 'bg-red-500'
                      }`}>
                        {skipped ? <Minus className="w-3.5 h-3.5 text-slate-400" /> :
                          correct ? <Check className="w-3.5 h-3.5 text-white"    /> :
                                    <X     className="w-3.5 h-3.5 text-white"    />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 line-clamp-2">
                          <span className="text-slate-400 mr-1">Q{i + 1}.</span>
                          {aq.question?.question_text}
                        </p>
                        {!isExpanded && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {skipped
                              ? 'Not answered'
                              : correct
                              ? `Correct · ${selectedOpt?.option_key ?? '—'}`
                              : `Wrong · Your: ${selectedOpt?.option_key ?? '—'} · Correct: ${correctOpt?.option_key ?? '—'}`
                            }
                          </p>
                        )}
                      </div>

                      {isExpanded
                        ? <ChevronUp   className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-5 space-y-2">
                        {allOpts.map(opt => {
                          const isUserPick  = opt.id === userAnswer?.selected_option_id;
                          const isCorrectOp = opt.is_correct;
                          let cls = 'border-slate-100 bg-slate-50 text-slate-600';
                          if (isCorrectOp)                    cls = 'border-green-200 bg-green-50 text-green-800';
                          else if (isUserPick && !isCorrectOp) cls = 'border-red-200 bg-red-50 text-red-700';

                          return (
                            <div key={opt.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cls}`}>
                              <span className="font-semibold shrink-0">{opt.option_key}.</span>
                              <span className="flex-1">{opt.option_text}</span>
                              {isCorrectOp  && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                              {isUserPick && !isCorrectOp && <X className="w-4 h-4 text-red-500 shrink-0" />}
                            </div>
                          );
                        })}

                        {/* Explanation */}
                        {(aq.question?.explanation || correctOpt?.explanation) && (
                          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                            <span className="font-semibold">Explanation: </span>
                            {aq.question?.explanation ?? correctOpt?.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};
