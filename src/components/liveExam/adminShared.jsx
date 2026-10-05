import React from 'react';

export const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent';

const PHASES = {
  upcoming: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  open: { label: 'Open now', className: 'bg-red-100 text-red-700' },
  closed: { label: 'Closed — results pending', className: 'bg-amber-100 text-amber-800' },
  results: { label: 'Results published', className: 'bg-green-100 text-green-700' },
};

export const PhaseBadge = ({ phase }) => {
  const p = PHASES[phase] ?? { label: phase, className: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${p.className}`}>{p.label}</span>;
};

/** Date → value for <input type="datetime-local"> in the admin's own timezone. */
export const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** datetime-local value (local time) → ISO string for the API. */
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
