// One colour theme per subject, picked by its position in the deck, so a
// subject keeps the same colour in the index, overview and study screens.
// Full class strings so Tailwind keeps them.
const SUBJECT_COLORS = [
  { gradient: 'from-violet-500 to-indigo-500', soft: 'bg-violet-50', text: 'text-violet-600', ring: 'text-violet-500', dot: 'bg-violet-500', hoverBorder: 'hover:border-violet-300' },
  { gradient: 'from-sky-500 to-blue-500', soft: 'bg-sky-50', text: 'text-sky-600', ring: 'text-sky-500', dot: 'bg-sky-500', hoverBorder: 'hover:border-sky-300' },
  { gradient: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-50', text: 'text-emerald-600', ring: 'text-emerald-500', dot: 'bg-emerald-500', hoverBorder: 'hover:border-emerald-300' },
  { gradient: 'from-rose-500 to-pink-500', soft: 'bg-rose-50', text: 'text-rose-600', ring: 'text-rose-500', dot: 'bg-rose-500', hoverBorder: 'hover:border-rose-300' },
  { gradient: 'from-amber-500 to-orange-500', soft: 'bg-amber-50', text: 'text-amber-600', ring: 'text-amber-500', dot: 'bg-amber-500', hoverBorder: 'hover:border-amber-300' },
  { gradient: 'from-fuchsia-500 to-purple-500', soft: 'bg-fuchsia-50', text: 'text-fuchsia-600', ring: 'text-fuchsia-500', dot: 'bg-fuchsia-500', hoverBorder: 'hover:border-fuchsia-300' },
  { gradient: 'from-cyan-500 to-sky-600', soft: 'bg-cyan-50', text: 'text-cyan-600', ring: 'text-cyan-500', dot: 'bg-cyan-500', hoverBorder: 'hover:border-cyan-300' },
  { gradient: 'from-lime-500 to-green-600', soft: 'bg-lime-50', text: 'text-lime-700', ring: 'text-lime-600', dot: 'bg-lime-500', hoverBorder: 'hover:border-lime-300' },
];

export const getSubjectColor = (subjectIndex = 0) => SUBJECT_COLORS[subjectIndex % SUBJECT_COLORS.length];
