import React, { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';

// Pieces shared by the student's own result, the public results page and the
// admin results — so all three read the same way.

export const StatTile = ({ label, value, sub }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
    <p className="text-2xl font-black text-slate-900 tabular-nums mt-0.5">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

/** Histogram of candidates by score band (10% buckets). One series, one hue. */
export const ScoreDistribution = ({ distribution, highlightPercent = null }) => {
  const max = Math.max(1, ...distribution.map((d) => d.count));
  const highlightBucket = highlightPercent == null ? -1 : Math.min(9, Math.floor(highlightPercent / 10));
  return (
    <div>
      <div className="flex items-end gap-[2px] h-40 border-b border-slate-200" role="img" aria-label="Number of candidates by score band">
        {distribution.map((d, i) => (
          <div key={d.from} className="group relative flex-1 h-full flex flex-col justify-end items-center">
            <span className="text-[10px] text-slate-500 tabular-nums mb-0.5">{d.count || ''}</span>
            <div
              className={`w-full max-w-10 rounded-t ${i === highlightBucket ? 'bg-violet-700' : 'bg-violet-400'}`}
              style={{ height: `${(d.count / max) * 85}%`, minHeight: d.count ? 2 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white z-10">
              {d.from}–{d.to}%: {d.count} candidate{d.count === 1 ? '' : 's'}
              {i === highlightBucket ? ' · you' : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] mt-1">
        {distribution.map((d) => (
          <span key={d.from} className="flex-1 text-center text-[10px] text-slate-400 tabular-nums">{d.from}</span>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 text-center mt-1">Score (%)</p>
    </div>
  );
};

/**
 * Horizontal bar per AMC domain. `value` is the bar; `marker` (optional) is a
 * thin gray tick for comparison, e.g. the cohort average next to a student's own.
 */
export const DomainBars = ({ rows, valueLabel = 'Correct', markerLabel = null }) => (
  <div className="space-y-3">
    {markerLabel && (
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-violet-500" /> {valueLabel}</span>
        <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-slate-500" /> {markerLabel}</span>
      </div>
    )}
    {rows.map((r) => (
      <div key={r.key} className="group">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-700 truncate">{r.label}</span>
          <span className="text-slate-900 font-semibold tabular-nums shrink-0">
            {r.value}%
            {r.detail && <span className="ml-1.5 text-xs font-normal text-slate-400">{r.detail}</span>}
          </span>
        </div>
        <div
          className="relative h-2.5 mt-1 rounded-full bg-slate-100"
          title={`${r.label}: ${valueLabel.toLowerCase()} ${r.value}%${r.marker != null ? ` · ${markerLabel?.toLowerCase()} ${r.marker}%` : ''}`}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-violet-500" style={{ width: `${Math.min(100, r.value)}%` }} />
          {r.marker != null && (
            <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-500 ring-2 ring-white" style={{ left: `calc(${Math.min(100, r.marker)}% - 1px)` }} />
          )}
        </div>
      </div>
    ))}
  </div>
);

const questionImages = (q) =>
  q?.question_images?.length ? q.question_images : q?.question_image ? [q.question_image] : [];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'wrong', label: 'Wrong' },
  { key: 'unanswered', label: 'Unanswered' },
  { key: 'correct', label: 'Correct' },
];

const statusOf = (q) => (q.selected_option_id == null ? 'unanswered' : q.is_correct ? 'correct' : q.is_correct === false ? 'wrong' : 'answered');

/** Question-by-question review: the candidate's pick, the right answer and explanations. */
export const ReviewList = ({ questions, showMarking = true }) => {
  const [filter, setFilter] = useState('all');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, f.key === 'all' ? questions.length : questions.filter((q) => statusOf(q) === f.key).length]));
  const shown = filter === 'all' ? questions : questions.filter((q) => statusOf(q) === filter);

  return (
    <div className="space-y-4">
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      {showMarking && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-xs rounded-full border ${filter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      )}
      {shown.map((q) => {
        const status = statusOf(q);
        return (
          <div key={q.question_id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500">Question {q.order}</span>
              <div className="flex items-center gap-2">
                {q.domain && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{q.domain}</span>}
                {showMarking && status === 'correct' && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Correct</span>}
                {showMarking && status === 'wrong' && <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle className="w-4 h-4" /> Wrong</span>}
                {status === 'unanswered' && <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MinusCircle className="w-4 h-4" /> Not answered</span>}
              </div>
            </div>
            <p className="text-[15px] font-medium text-slate-900 whitespace-pre-line leading-relaxed">{q.question_text}</p>
            {questionImages(q).map((src) => (
              <div key={src} className="my-3 flex justify-center">
                <ProtectedImage src={src} alt="Question" className="max-w-full max-h-72 rounded-lg border border-slate-200" onClick={setLightboxSrc} />
              </div>
            ))}
            <div className="mt-3 space-y-2">
              {q.options.map((o) => {
                const picked = o.id === q.selected_option_id;
                const tone = !showMarking
                  ? picked ? 'border-violet-400 bg-violet-50' : 'border-slate-200'
                  : o.is_correct ? 'border-emerald-400 bg-emerald-50'
                  : picked ? 'border-red-300 bg-red-50' : 'border-slate-200';
                return (
                  <div key={o.id} className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-600 w-5 shrink-0">{o.option_key}</span>
                      <span className="flex-1 text-slate-800">{o.option_text}</span>
                      {picked && <span className="text-[11px] font-semibold text-slate-500 shrink-0">Selected</span>}
                      {showMarking && o.is_correct && <span className="text-[11px] font-semibold text-emerald-700 shrink-0">Answer</span>}
                    </div>
                    {showMarking && o.explanation && <p className="mt-1 ml-7 text-xs text-slate-600 whitespace-pre-line">{o.explanation}</p>}
                  </div>
                );
              })}
            </div>
            {showMarking && (q.explanation || q.answer_images?.length > 0) && (
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">
                {q.explanation && <p className="whitespace-pre-line">{q.explanation}</p>}
                {(q.answer_images ?? []).map((src) => (
                  <ProtectedImage key={src} src={src} alt="Explanation" className="mt-2 max-w-full max-h-72 rounded-lg border border-slate-200" onClick={setLightboxSrc} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {!shown.length && <p className="text-sm text-slate-400 text-center py-6">No questions in this group.</p>}
    </div>
  );
};
