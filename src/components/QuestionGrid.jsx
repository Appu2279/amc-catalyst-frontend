import React from 'react';

/**
 * Numbered boxes for every question in a practice set, coloured by how the
 * student did, so they can jump straight to any question instead of pressing
 * Next a hundred times through a 250-question recall.
 *
 * `answered` maps question id → is_correct; a missing key means unanswered.
 * With isIncorrectOnly, only the questions answered wrong are listed — the
 * numbers stay their place in the full set so "Q47" means the same thing in
 * both views.
 */
export const QuestionGrid = ({ ids, answered, currentIdx, isIncorrectOnly, onJump }) => {
  const items = ids
    .map((id, idx) => ({ id, idx }))
    .filter(({ id }) => !isIncorrectOnly || answered[id] === false);

  return (
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-3 mb-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Correct</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Incorrect</span>
        {!isIncorrectOnly && (
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-slate-300 bg-white" /> Not answered</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
        {items.map(({ id, idx }) => {
          const isCurrent = idx === currentIdx;
          let colourCls = 'bg-white text-slate-500 border-slate-200 hover:border-slate-400';
          if (answered[id] === true) colourCls = 'bg-green-100 text-green-800 border-green-200 hover:border-green-400';
          if (answered[id] === false) colourCls = 'bg-red-100 text-red-800 border-red-200 hover:border-red-400';

          return (
            <button
              key={id}
              onClick={() => onJump(idx)}
              className={`w-9 h-8 rounded-md border text-xs font-semibold tabular-nums transition-colors ${colourCls} ${isCurrent ? 'ring-2 ring-brand-blue ring-offset-1' : ''}`}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
