import React from 'react';
import {
  HeartPulse, Brain, Baby, Bone, Eye, Ear, Wind, Stethoscope, Scale, Bug,
  BarChart3, Droplets, Scissors, Activity, ShieldPlus, Pill,
} from 'lucide-react';

// The subjects the 22 notes actually cover (see AMCNotesIndex).
const ROW_ONE = [
  { name: 'Cardiology', icon: HeartPulse },
  { name: 'Psychiatry', icon: Brain },
  { name: 'Obstetrics', icon: Baby },
  { name: 'Orthopaedics', icon: Bone },
  { name: 'Ophthalmology', icon: Eye },
  { name: 'ENT', icon: Ear },
  { name: 'Respiratory', icon: Wind },
  { name: 'Neurology', icon: Activity },
];
const ROW_TWO = [
  { name: 'Ethics', icon: Scale },
  { name: 'Venom & Bites', icon: Bug },
  { name: 'Statistics', icon: BarChart3 },
  { name: 'Haematology', icon: Droplets },
  { name: 'Surgery', icon: Scissors },
  { name: 'Paediatrics', icon: Stethoscope },
  { name: 'Preventative Medicine', icon: ShieldPlus },
  { name: 'Endocrinology', icon: Pill },
];

// One row is rendered twice back to back and slid by -50%, so the loop is
// seamless. Pauses on hover; static for reduced-motion visitors.
const Row = ({ items, reverse }) => (
  <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
    {[0, 1].map((copy) => (
      <ul
        key={copy}
        aria-hidden={copy === 1}
        className={`flex shrink-0 gap-3 pr-3 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused] motion-reduce:animate-none`}
      >
        {items.map(({ name, icon: Icon }) => (
          <li
            key={name}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <Icon className="w-4 h-4 text-brand-violet" aria-hidden="true" />
            {name}
          </li>
        ))}
      </ul>
    ))}
  </div>
);

export const SubjectMarquee = () => (
  <section aria-label="Subjects covered" className="py-10 bg-slate-50 border-y border-slate-100 space-y-3">
    <Row items={ROW_ONE} />
    <Row items={ROW_TWO} reverse />
  </section>
);
