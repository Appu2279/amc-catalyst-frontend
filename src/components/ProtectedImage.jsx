/**
 * ProtectedImage
 *
 * Fetches the image through the authenticated backend proxy via axios
 * (so the Authorization header is sent), converts the response to an
 * in-memory blob URL, and renders that — the real storage URL never
 * appears anywhere in the DOM or network response tab.
 *
 * Additional client-side protections:
 *   • pointer-events:none on <img>   → right-click "Save image as" disabled
 *   • draggable={false}              → no drag-to-desktop / drag-to-tab
 *   • transparent overlay div        → swallows all mouse events on the image
 *   • onContextMenu preventDefault   → suppresses context menu entirely
 *   • blob URL expires on unmount    → revokeObjectURL cleans up immediately
 */
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';

/**
 * onClick (optional): called with the resolved blob URL when the user clicks
 * the image.  The parent can pass this to a Lightbox to show a full-size view.
 * When provided the cursor becomes `zoom-in` and a subtle magnifier icon appears.
 */
export const ProtectedImage = ({ src, alt = '', className = '', style = {}, onClick }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [errored, setErrored]  = useState(false);

  useEffect(() => {
    if (!src) return;
    let objectUrl = null;
    setBlobUrl(null);
    setErrored(false);

    axiosInstance
      .get(`/images/proxy?url=${encodeURIComponent(src)}`, { responseType: 'blob' })
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => setErrored(true));

    // Revoke the blob URL when the component unmounts or src changes
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src || errored) return null;

  // Loading skeleton while the proxy request is in-flight
  if (!blobUrl) {
    return (
      <div
        className={`${className} bg-slate-100 animate-pulse rounded-xl`}
        style={style}
      />
    );
  }

  return (
    <div
      className="relative select-none group"
      style={{ WebkitUserDrag: 'none', userSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      <img
        src={blobUrl}
        alt={alt}
        className={className}
        style={{ ...style, pointerEvents: 'none', WebkitUserDrag: 'none' }}
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      />
      {/* Transparent overlay — captures all mouse/touch events, optionally opens lightbox */}
      <div
        className={`absolute inset-0 z-10 ${onClick ? 'cursor-zoom-in' : ''}`}
        onContextMenu={e => e.preventDefault()}
        draggable={false}
        onClick={onClick && blobUrl ? () => onClick(blobUrl) : undefined}
      >
        {/* Magnifier hint shown on hover when expandable */}
        {onClick && (
          <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-md p-1 pointer-events-none">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
