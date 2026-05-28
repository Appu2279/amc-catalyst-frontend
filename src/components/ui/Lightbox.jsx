/**
 * Lightbox
 *
 * Full-screen image viewer. Pass any image URL (blob URL from ProtectedImage
 * or a regular https URL) via `src`.  Click the backdrop, the × button, or
 * press Escape to close.
 */
import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

export const Lightbox = ({ src, onClose }) => {
  // Close on Escape
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [src, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs select-none pointer-events-none">
        Click anywhere or press Esc to close
      </p>

      {/* Image wrapper — stop propagation so clicking the image doesn't close */}
      <div
        className="relative flex items-center justify-center p-4"
        style={{ maxWidth: '95vw', maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Full size view"
          draggable={false}
          className="object-contain rounded-lg shadow-2xl select-none"
          style={{
            maxWidth:  'min(95vw, 1400px)',
            maxHeight: '90vh',
            userSelect: 'none',
            WebkitUserDrag: 'none',
          }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>
    </div>
  );
};
