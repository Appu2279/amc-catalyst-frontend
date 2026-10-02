import React, { useId } from 'react';

/**
 * Sydney Harbour at dusk — the CBD, Sydney Tower and the Harbour Bridge in
 * silhouette over the water, with the city lights reflected below. Shown
 * faded and soft, like a memory (see FirstBatchAnnouncement).
 * Background art for the First Batch panel (after the poster's skyline), so
 * the section reads "your future in Australia" rather than a flat colour.
 *
 * Pure SVG, sharp at any width. The whole skyline is always shown, centred
 * and bottom-anchored; the water runs past the drawing (overflow visible) so
 * it spans the full width on wide screens.
 */
const NIGHT = '#120a2e';
const CITY_FAR = '#3a2161';
const CITY_NEAR = '#1f1240';

// [x, width, height] for the far and near CBD towers
const FAR_TOWERS = [
  [470, 26, 74], [500, 20, 96], [524, 30, 64], [558, 22, 118], [584, 28, 86], [616, 18, 104],
  [638, 34, 70], [676, 24, 128], [704, 30, 92], [738, 22, 110], [800, 26, 84], [830, 20, 66],
];
const NEAR_TOWERS = [
  [452, 34, 46], [490, 26, 62], [520, 40, 40], [566, 30, 74], [600, 24, 54], [628, 38, 82],
  [670, 28, 58], [702, 36, 70], [742, 30, 50], [776, 26, 64], [806, 32, 44],
];

export const SydneyHarbour = ({ className = '' }) => {
  // Unique gradient ids per instance: the page renders a phone and a desktop
  // copy, and a gradient defined inside the hidden (display:none) copy would
  // paint nothing in the visible one.
  const uid = useId().replace(/:/g, '');
  const id = (name) => `${name}-${uid}`;
  return (
  <svg
    viewBox="420 0 800 300"
    preserveAspectRatio="xMidYMax meet"
    overflow="visible"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id={id('sh-water')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b1650" />
        <stop offset="1" stopColor={NIGHT} />
      </linearGradient>
      <linearGradient id={id('sh-fade')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </linearGradient>
    </defs>

    {/* Far CBD towers */}
    <g fill={CITY_FAR}>
      {FAR_TOWERS.map(([x, w, h]) => (
        <rect key={`f${x}`} x={x} y={232 - h} width={w} height={h} />
      ))}
    </g>

    {/* Sydney Tower: mast, turret and spire */}
    <g fill={CITY_FAR}>
      <rect x="771" y="80" width="6" height="152" />
      <path d="M760 98 h28 l-4 18 h-20 Z" />
      <rect x="766" y="92" width="16" height="6" rx="2" />
      <rect x="773" y="44" width="2" height="48" />
    </g>

    {/* Near CBD towers, with a few lit windows */}
    <g fill={CITY_NEAR}>
      {NEAR_TOWERS.map(([x, w, h]) => (
        <rect key={`n${x}`} x={x} y={232 - h} width={w} height={h} />
      ))}
    </g>
    <g fill="#fcd34d" opacity="0.55">
      {[[574, 172], [580, 186], [636, 164], [648, 180], [710, 176], [716, 192], [784, 184], [498, 186], [528, 200]].map(([x, y]) => (
        <rect key={`w${x}${y}`} x={x} y={y} width="4" height="5" />
      ))}
    </g>

    {/* Harbour Bridge: pylons, arch, hangers and deck */}
    <g fill={NIGHT} stroke={NIGHT}>
      <path d="M860 232 C 960 108, 1100 108, 1200 232" fill="none" strokeWidth="9" />
      <path d="M880 232 C 970 136, 1090 136, 1182 232" fill="none" strokeWidth="4" />
      {[900, 925, 950, 975, 1000, 1025, 1050, 1075, 1100, 1125, 1150].map((x) => (
        <line key={`h${x}`} x1={x} y1="196" x2={x} y2={x < 1030 ? 236 - (x - 860) * 0.62 : 236 - (1200 - x) * 0.62} strokeWidth="2" />
      ))}
      <rect x="836" y="194" width="372" height="7" stroke="none" />
      <rect x="842" y="160" width="26" height="72" stroke="none" />
      <rect x="1176" y="160" width="26" height="72" stroke="none" />
      <rect x="838" y="154" width="34" height="8" stroke="none" />
      <rect x="1172" y="154" width="34" height="8" stroke="none" />
    </g>

    {/* Waterline and harbour */}
    <rect x="-1600" y="232" width="4400" height="68" fill={`url(#${id('sh-water')})`} />
    <line x1="-1600" y1="232" x2="2800" y2="232" stroke="#f9a8d4" strokeWidth="1.5" opacity="0.4" />

    {/* Reflections of the city lights */}
    <g stroke="#fcd34d" strokeLinecap="round" opacity="0.25">
      <line x1="520" y1="248" x2="700" y2="248" strokeWidth="2" />
      <line x1="560" y1="262" x2="660" y2="262" strokeWidth="2" />
      <line x1="900" y1="252" x2="1140" y2="252" strokeWidth="2" />
    </g>
    <rect x="-1600" y="232" width="4400" height="68" fill={`url(#${id('sh-fade')})`} />
  </svg>
  );
};

/**
 * A small airliner crossing the sky with a fading contrail — "flying to
 * Australia". CSS-animated (compositor-only), off for reduced motion.
 */
export const FlyingPlane = ({ className = '' }) => (
  <div className={`pointer-events-none ${className}`} aria-hidden="true">
    <div className="animate-fly-across motion-reduce:animate-none flex items-center">
      <span className="h-0.5 w-40 sm:w-56 rounded-full bg-gradient-to-r from-transparent to-white/60" />
      <svg viewBox="0 0 48 24" className="w-10 sm:w-12 -ml-1 shrink-0">
        <path
          d="M2 13 L18 12 L28 2 L33 2 L27 12 L40 11 C 46 11, 46 13, 40 13 L27 13 L33 22 L28 22 L18 14 L2 14 L6 13 Z"
          fill="#ffffff"
          opacity="0.9"
        />
      </svg>
    </div>
  </div>
);
