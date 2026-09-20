import React from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { Workflow, MoveHorizontal } from 'lucide-react';

// ── Colours ──────────────────────────────────────────────────────────────────
// One colour per pathway, reused for its header box, its arrows, and its
// accordion entry below — that repetition is what lets someone trace a single
// pathway through the diagram by eye.
const PATHWAY_COLOR = {
  orange: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-700', chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  cyan: { hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-700', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  green: { hex: '#16a34a', bg: 'bg-green-600', text: 'text-green-700', chip: 'bg-green-50 text-green-700 border-green-200' },
  blue: { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-700', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
};
const NAVY = '#1a4971';

// ── Diagram data ─────────────────────────────────────────────────────────────
// A fixed 1000×900 canvas, positioned with plain pixel coordinates rather than
// percentages. Simpler than making an SVG flowchart responsive by scaling it:
// instead the canvas never resizes, and the container around it scrolls
// horizontally below the point it stops fitting (see the wrapper below) —
// the same trade a wide data table makes on a phone screen.
const W = 1000;
const H = 900;

const BOXES = [
  // Headers — one per pathway, coloured.
  { id: 'std', x: 20, y: 20, w: 220, h: 55, label: 'STANDARD PATHWAY', color: 'orange' },
  { id: 'comp', x: 260, y: 20, w: 220, h: 55, label: 'COMPETENT AUTHORITY PATHWAY', color: 'cyan' },
  { id: 'area', x: 500, y: 20, w: 220, h: 55, label: 'AREA OF NEED PATHWAY', color: 'green' },
  { id: 'spec', x: 740, y: 20, w: 240, h: 55, label: 'SPECIALISTS PATHWAY', color: 'blue' },

  // Both wide enough to reach under most of the Area of Need column too — the
  // green pathway drops straight into them the same way orange/cyan do, it
  // just has no box of its own at the AMC CAT MCQ / Advanced Standing row.
  { id: 'verify', x: 20, y: 125, w: 630, h: 65, label: 'VERIFICATION OF PRIMARY MEDICAL DEGREE & ENGLISH LANGUAGE PROFICIENCY', navy: true },

  { id: 'mcq', x: 20, y: 235, w: 220, h: 65, label: 'AMC CAT MCQ', navy: true },
  { id: 'advstand', x: 260, y: 235, w: 220, h: 65, label: 'ADVANCED STANDING CERTIFICATE (APPLICATION TO AMC)', navy: true },

  { id: 'clinical1', x: 20, y: 340, w: 220, h: 55, label: 'AMC (CLINICAL)*', navy: true },

  { id: 'employer', x: 20, y: 435, w: 630, h: 60, label: 'AUSTRALIAN EMPLOYER OFFER LETTER', navy: true },

  { id: 'limited', x: 20, y: 535, w: 220, h: 55, label: 'LIMITED REGISTRATION', navy: true },
  { id: 'provisional', x: 260, y: 535, w: 220, h: 55, label: 'PROVISIONAL REGISTRATION', navy: true },
  { id: 'specapp', x: 500, y: 535, w: 480, h: 55, label: 'SPECIALIST ASSESSMENT APPLICATION (TO SPECIALIST MEDICAL COLLEGE)', navy: true },

  { id: 'hospital', x: 20, y: 630, w: 220, h: 70, label: 'HOSPITAL PRACTICE (1 YR) (SUPERVISED)', navy: true },
  { id: 'pba', x: 500, y: 630, w: 220, h: 175, label: 'PRACTICE BASED ASSESSMENT', navy: true, dashed: 'green' },

  { id: 'clinical2', x: 260, y: 730, w: 220, h: 55, label: 'AMC (CLINICAL)*', navy: true },

  { id: 'proceed', x: 20, y: 830, w: 220, h: 60, label: 'PROCEED TO AREA OF NEED REGISTRATION OR SPECIALIST TRAINING', navy: true },
  { id: 'regGeneral', x: 260, y: 830, w: 220, h: 60, label: 'AMC REGISTRATION – GENERAL', navy: true },
  { id: 'regAreaOfNeed', x: 500, y: 830, w: 220, h: 60, label: 'AMC REGISTRATION – AREA OF NEED', navy: true },
  { id: 'regSpecialist', x: 740, y: 830, w: 240, h: 60, label: 'AMC REGISTRATION – SPECIALIST', navy: true },
];

// {x1,y1,x2,y2,color,dashed?}. Colour traces which pathway a step belongs to;
// dashed marks the "or take a workplace-based assessment instead" branches.
const ARROWS = [
  { x1: 130, y1: 75, x2: 130, y2: 125, color: 'orange' },
  { x1: 370, y1: 75, x2: 370, y2: 125, color: 'cyan' },
  { x1: 610, y1: 75, x2: 610, y2: 125, color: 'green' },
  { x1: 860, y1: 75, x2: 860, y2: 535, color: 'blue' },

  { x1: 130, y1: 190, x2: 130, y2: 235, color: 'orange' },
  { x1: 370, y1: 190, x2: 370, y2: 235, color: 'cyan' },
  // Straight down, skipping the MCQ / Advanced Standing row entirely — Area
  // of Need has no exam step here, it goes straight from verification to an
  // employer offer.
  { x1: 610, y1: 190, x2: 610, y2: 435, color: 'green' },

  { x1: 130, y1: 300, x2: 130, y2: 340, color: 'orange' },
  { x1: 130, y1: 395, x2: 130, y2: 435, color: 'orange' },
  { x1: 370, y1: 300, x2: 370, y2: 435, color: 'cyan' },

  { x1: 130, y1: 495, x2: 130, y2: 535, color: 'orange' },
  { x1: 190, y1: 495, x2: 330, y2: 535, color: 'orange' },
  { x1: 370, y1: 495, x2: 370, y2: 535, color: 'cyan' },
  // Area of Need continues on from the employer offer letter to the same
  // "specialist assessment application" box the Specialist pathway uses —
  // not to Provisional Registration / Practice Based Assessment at all.
  { x1: 610, y1: 495, x2: 610, y2: 535, color: 'green' },

  { x1: 130, y1: 590, x2: 130, y2: 630, color: 'orange' },
  { x1: 330, y1: 590, x2: 170, y2: 630, color: 'orange' },
  { x1: 370, y1: 590, x2: 370, y2: 730, color: 'cyan' },

  { x1: 240, y1: 555, x2: 500, y2: 620, color: 'orange', dashed: true },
  { x1: 240, y1: 665, x2: 500, y2: 690, color: 'orange', dashed: true },

  { x1: 370, y1: 785, x2: 330, y2: 830, color: 'orange' },
  { x1: 370, y1: 785, x2: 370, y2: 830, color: 'cyan' },
  { x1: 130, y1: 700, x2: 300, y2: 830, color: 'orange' },

  // Specialist Assessment Application → AMC Registration – Area of Need,
  // routed right of the Practice Based Assessment box (which sits directly
  // in that column) rather than through it — Area of Need has nothing to do
  // with Practice Based Assessment.
  { x1: 610, y1: 590, x2: 750, y2: 590, color: 'green', noHead: true },
  { x1: 750, y1: 590, x2: 750, y2: 810, color: 'green', noHead: true },
  { x1: 750, y1: 810, x2: 650, y2: 830, color: 'green' },
  { x1: 560, y1: 750, x2: 300, y2: 830, color: 'orange', dashed: true },

  { x1: 860, y1: 590, x2: 860, y2: 830, color: 'blue' },

  { x1: 260, y1: 860, x2: 240, y2: 860, color: 'cyan' },
];

const Box = ({ box }) => {
  const palette = box.color ? PATHWAY_COLOR[box.color] : null;
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        backgroundColor: palette ? undefined : NAVY,
        outline: box.dashed ? `2px dashed ${PATHWAY_COLOR[box.dashed].hex}` : undefined,
        outlineOffset: box.dashed ? '3px' : undefined,
      }}
      className={`rounded-lg shadow-md flex items-center justify-center text-center px-3 ${palette ? palette.bg : ''}`}
    >
      <p className="text-white font-bold uppercase tracking-tight leading-tight text-[10.5px] sm:text-[11px]">
        {box.label}
      </p>
    </div>
  );
};

const Arrows = () => (
  <svg width={W} height={H} className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
    <defs>
      {Object.entries(PATHWAY_COLOR).map(([key, c]) => (
        <marker
          key={key}
          id={`arrowhead-${key}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={c.hex} />
        </marker>
      ))}
    </defs>
    {ARROWS.map((a, i) => (
      <line
        key={i}
        x1={a.x1}
        y1={a.y1}
        x2={a.x2}
        y2={a.y2}
        stroke={PATHWAY_COLOR[a.color].hex}
        strokeWidth={a.dashed ? 2 : 2.5}
        strokeDasharray={a.dashed ? '6 5' : undefined}
        markerEnd={a.noHead ? undefined : `url(#arrowhead-${a.color})`}
      />
    ))}
  </svg>
);

// ── Plain-language breakdown ─────────────────────────────────────────────────
// The same information as the diagram, one pathway at a time — this is what
// carries the page on a phone, where a 1000px-wide diagram is something you
// scroll rather than something you read at a glance.
const PATHWAYS = [
  {
    key: 'standard',
    label: 'Standard Pathway',
    color: 'orange',
    steps: [
      'Verification of primary medical degree & English language proficiency',
      'AMC CAT MCQ, then AMC Clinical exam',
      'Australian employer offer letter',
      'Limited registration',
      'Hospital practice — 1 year, supervised',
      'AMC Registration – General',
    ],
  },
  {
    key: 'competent-authority',
    label: 'Competent Authority Pathway',
    color: 'cyan',
    steps: [
      'Verification of primary medical degree & English language proficiency',
      'Advanced Standing Certificate (application to AMC)',
      'Australian employer offer letter',
      'Provisional registration',
      'Hospital practice (1 year) or AMC Clinical exam',
      'AMC Registration – General',
    ],
  },
  {
    key: 'area-of-need',
    label: 'Area of Need Pathway',
    color: 'green',
    steps: [
      'Verification of primary medical degree & English language proficiency',
      'Australian employer offer letter for an area-of-need position',
      'Specialist assessment application (to specialist medical college)',
      'AMC Registration – Area of Need',
    ],
  },
  {
    key: 'specialist',
    label: 'Specialists Pathway',
    color: 'blue',
    steps: [
      'Specialist assessment application to the relevant specialist medical college',
      'AMC Registration – Specialist',
    ],
  },
];

const PathwayCard = ({ pathway }) => {
  const c = PATHWAY_COLOR[pathway.color];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.bg}`} />
        <span className="font-semibold text-slate-900">{pathway.label}</span>
      </div>
      <ol className="px-5 py-4 space-y-2.5">
        {pathway.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
            <span
              className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center ${c.chip}`}
            >
              {i + 1}
            </span>
            <span className="leading-snug pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const RegistrationPathway = () => (
  <DashboardLayout active="registration">
    <div className="min-h-full bg-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300 mb-3">
            <Workflow className="w-3.5 h-3.5" /> Registration
          </span>
          <h1 className="relative z-10 text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            The AMC registration pathway
          </h1>
          <p className="relative z-10 text-slate-300 text-xs sm:text-sm font-medium mt-2 max-w-2xl">
            Four routes to AMC registration, from your first qualification check to a final
            registration outcome. Follow one colour from top to bottom to trace a single pathway.
          </p>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(PATHWAY_COLOR).map(([key, c]) => {
            const p = PATHWAYS.find((pw) => pw.color === key);
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.chip}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                {p?.label}
              </span>
            );
          })}
        </div>

        {/* ── Diagram ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="lg:hidden flex items-center gap-1.5 text-xs font-medium text-slate-400 px-4 pt-4">
            <MoveHorizontal className="w-3.5 h-3.5" /> Scroll sideways to see the full pathway
          </p>
          <div className="overflow-x-auto overscroll-x-contain p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="relative" style={{ width: W, height: H }}>
              <Arrows />
              {BOXES.map((box) => (
                <Box key={box.id} box={box} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Per-pathway breakdown ────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Each pathway, step by step</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PATHWAYS.map((p) => (
              <PathwayCard key={p.key} pathway={p} />
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl">
          This is a simplified guide to the AMC registration process — exact requirements vary by
          state, territory and individual circumstances. Always confirm the current requirements on
          the official Australian Medical Council website before relying on this for your own
          application.
        </p>
      </div>
    </div>
  </DashboardLayout>
);
