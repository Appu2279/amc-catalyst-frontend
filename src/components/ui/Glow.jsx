import React from 'react';

/**
 * A soft coloured glow for dark backgrounds.
 *
 * Drawn as a radial gradient rather than a solid circle under `filter: blur()`
 * — it looks the same, but a large blur filter is one of the most expensive
 * things a browser can paint, and repainting it while it drifts was a big part
 * of the homepage feeling laggy on phones. The gradient bleeds 45% past the
 * element's box on every side, roughly where the old blur's edge reached, so
 * existing positions and sizes carry over unchanged.
 *
 * `animation` takes a CSS animation utility (animate-drift-1, …); it is turned
 * off for reduced-motion visitors.
 */
export const Glow = ({ className = '', color, animation = '', style }) => (
  <div
    aria-hidden="true"
    className={`absolute pointer-events-none ${animation} motion-reduce:animate-none ${className}`}
    style={style}
  >
    <span
      className="absolute -inset-[45%]"
      style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }}
    />
  </div>
);

export const GLOW = {
  violet: (a) => `rgba(124, 58, 237, ${a})`,
  blue: (a) => `rgba(37, 99, 235, ${a})`,
  gold: (a) => `rgba(217, 119, 6, ${a})`,
};
