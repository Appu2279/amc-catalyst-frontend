/**
 * PdfViewer
 *
 * Renders a PDF to <canvas> elements with PDF.js instead of handing it to the
 * browser's built-in viewer.
 *
 * Why not an <iframe>: Chrome's PDF viewer ships its own toolbar with download
 * and print buttons. `#toolbar=0` hides them in Chrome but is only a hint —
 * Firefox ignores it — and the framed document is still a real PDF the user can
 * save with Ctrl+S or the context menu. Drawing to a canvas means the page
 * never holds a PDF at all, only pixels.
 *
 * This raises the effort required; it does not make the file unreachable. The
 * bytes must arrive for the pages to render, so anyone willing to open DevTools
 * can still retrieve them, and no web page can prevent a screenshot. The
 * server-side per-account watermark is what makes a leaked copy traceable —
 * that is the actual control, and this viewer is the deterrent in front of it.
 *
 * Reading model: one continuous scroll, the way every PDF reader students
 * already use behaves. Pages are stacked in a single scroller and the reader
 * moves through the note with the wheel, a trackpad or a thumb — there are no
 * previous/next buttons, and a page boundary is no longer something to click
 * through.
 *
 * Only the pages near the viewport actually hold pixels. Every page's on-screen
 * box is known up front from its unscaled size, so the scroller can be laid out
 * at full height immediately while the canvases inside it are painted and then
 * released as they come into and leave that window. A 32-page note held
 * entirely in canvases would cost well over 100MB of memory on a phone; this
 * keeps three or four alive regardless of how long the note is.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// The *legacy* build, deliberately, not 'pdfjs-dist'.
//
// The default build targets browsers that have shipped everything PDF.js uses
// natively, and reaches for Promise.withResolvers in ~40 places across the API
// and the worker. Safari only gained that in 17.4, so on an iPad still on
// iPadOS 16 or 17.0-17.3 — a large share of the ones students actually own —
// getDocument() threw a TypeError before a single page was decoded and the
// reader saw the "could not be displayed" state. Chrome and desktop Safari
// were unaffected, which is why this looked like an iPad-only blank.
//
// The legacy build is the same library with core-js polyfills folded in. It
// costs ~110KB across the two chunks; the alternative is that the notes
// section does not work on an iPad at all.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker&inline';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// The worker is inlined into the bundle rather than loaded as a separate file.
// This project builds with vite-plugin-singlefile, which emits one HTML file —
// a worker served from its own URL would simply 404 in production.
//
// Deliberately NOT GlobalWorkerOptions.workerPort. A single shared port looks
// like the efficient choice and breaks on the second note opened: closing a
// document calls worker.destroy(), which terminates the port for good, and the
// next getDocument() throws "PDFWorker.create - the worker is being destroyed."
// Each document therefore gets its own worker, created below.
//
// PDF.js only takes ownership of a worker it created itself (it sets
// task._worker in that case), so a worker passed in here is ours to destroy —
// see the cleanup in the load effect.

const GUTTER = 12; // breathing room at the top, bottom and sides of the stack
const PAGE_GAP = 16; // gap between consecutive pages
// A page fits the width of the scroller, but only up to this. On a wide desktop
// an unbounded fit-width turns an A4 page into a wall of oversized type that is
// slower to read, not easier.
const MAX_PAGE_WIDTH = 900;
// Viewport-heights of pages kept painted above and below the visible window, so
// a normal scroll lands on an already-drawn page rather than a placeholder.
const OVERSCAN = 1;
// A canvas has a hard pixel budget: iOS Safari refuses to allocate much past
// ~16MP and hands back a blank bitmap rather than an error. A big page at 400%
// on a retina screen asks for four times that, so the budget is enforced here.
const MAX_CANVAS_PIXELS = 16 * 1024 * 1024;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

/**
 * One page of the stack, mounted only while it is inside the painted window.
 * Its box is reserved by the stack itself, so mounting and unmounting pages
 * never moves the scroll position under the reader.
 */
const PageView = ({ doc, pageNumber, top, width, height, scale, title }) => {
  const canvasRef = useRef(null);
  // The page proxy, kept so its operator list can be released on the way out —
  // PDF.js caches that per page and it dwarfs the canvas on a dense page.
  const pageRef = useRef(null);
  // The in-flight render, if any. A render must be cancelled AND awaited before
  // anything else touches its canvas: cancelling alone still leaves the old
  // task mid-write, which throws "Cannot use the same canvas during multiple
  // render operations" and blanks the page.
  const renderRef = useRef(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;

    (async () => {
      const previous = renderRef.current;
      if (previous) {
        previous.cancel();
        await previous.promise.catch(() => {});
        renderRef.current = null;
      }
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      let page;
      try {
        page = await doc.getPage(pageNumber);
      } catch {
        return;
      }
      if (cancelled) return;
      pageRef.current = page;

      // Render at the zoomed resolution rather than CSS-scaling a smaller
      // bitmap up, so magnified text stays sharp instead of turning into
      // enlarged pixels. Capped at 2x: beyond that the memory cost is real and
      // the gain is not visible.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let renderScale = scale * dpr;
      // Past the pixel budget the extra sharpness is given back first — a
      // slightly softer page at 400% beats a blank one on a phone.
      const probe = page.getViewport({ scale: renderScale });
      const pixels = probe.width * probe.height;
      if (pixels > MAX_CANVAS_PIXELS) renderScale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
      const viewport = page.getViewport({ scale: renderScale });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderRef.current = task;
      try {
        await task.promise;
        if (!cancelled) setPainted(true);
      } catch {
        // A cancelled render is the expected outcome of scrolling or zooming
        // past a page, and is nobody's concern.
      } finally {
        if (renderRef.current === task) renderRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      const task = renderRef.current;
      const page = pageRef.current;
      pageRef.current = null;
      if (!task) {
        page?.cleanup();
        return;
      }
      // cleanup() on a page that is still rendering is refused with a warning,
      // so it waits for the cancellation to settle. React cleanups cannot be
      // async, hence the chain rather than an await.
      task.cancel();
      task.promise.catch(() => {}).finally(() => page?.cleanup());
    };
  }, [doc, pageNumber, scale]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-sm overflow-hidden"
      style={{ top, width, height }}
      data-page={pageNumber}
    >
      <canvas
        ref={canvasRef}
        aria-label={`${title} — page ${pageNumber}`}
        className="block w-full h-full select-none"
        draggable={false}
      />
      {!painted && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <span className="text-[11px] text-slate-300 tabular-nums">{pageNumber}</span>
        </div>
      )}
    </div>
  );
};

export const PdfViewer = ({ data, title }) => {
  const containerRef = useRef(null);

  const [doc, setDoc] = useState(null);
  // Unscaled {w, h} per page, read once when the document opens. Pages in a
  // single note are not guaranteed to share a size, so each is measured.
  const [sizes, setSizes] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [range, setRange] = useState({ start: 0, end: -1 });
  const [current, setCurrent] = useState(1);
  // The message a failed open came back with, not just a flag: when a PDF only
  // fails on one device the reason is the whole diagnosis, and a reader who can
  // read it out loud saves a round of guessing.
  const [errored, setErrored] = useState(null);

  // Load the document once per payload.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    setDoc(null);
    setSizes([]);
    setZoom(1);
    setCurrent(1);
    setRange({ start: 0, end: -1 });
    setErrored(null);

    // One worker per document — see the note above GlobalWorkerOptions.
    const worker = new pdfjsLib.PDFWorker({ port: new PdfWorker() });

    // PDF.js takes ownership of the buffer it is given and detaches it, which
    // would break a re-render from the same response. A copy keeps the original
    // intact.
    const task = pdfjsLib.getDocument({ data: data.slice(0), worker });

    task.promise
      .then(async (pdf) => {
        if (cancelled) return;
        // Page proxies are cheap; their viewports are what the stack needs to
        // reserve the right height before a single pixel is drawn.
        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
        );
        if (cancelled) return;
        setSizes(
          pages.map((p) => {
            const v = p.getViewport({ scale: 1 });
            return { w: v.width, h: v.height };
          })
        );
        setDoc(pdf);
      })
      .catch((err) => !cancelled && setErrored(err?.message || 'Unknown error'));

    return () => {
      cancelled = true;
      setDoc(null);

      // destroy() is async: it flags the worker as pending-destroy, awaits the
      // transport teardown, and only then finishes. Firing it without awaiting
      // is what caused the crash when a note was opened, closed and reopened.
      // React cleanups cannot be async, so the teardown is sequenced here and
      // the worker is destroyed only once the task has finished with it.
      task
        .destroy()
        .catch(() => {})
        .finally(() => worker.destroy());
    };
  }, [data]);

  // Track the scroller's own size rather than the window's: the sidebar
  // collapsing beside it changes the available width without a window resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc]);

  // Where every page sits in the stack, at the current width and zoom.
  const layout = useMemo(() => {
    const available = Math.max(box.w - GUTTER * 2, 200);
    const target = Math.min(available, MAX_PAGE_WIDTH) * zoom;
    let top = GUTTER;
    let widest = 0;
    const items = sizes.map((size) => {
      const scale = target / size.w;
      const width = Math.round(size.w * scale);
      const height = Math.round(size.h * scale);
      const item = { top, width, height, scale };
      top += height + PAGE_GAP;
      widest = Math.max(widest, width);
      return item;
    });
    return {
      items,
      height: items.length ? top - PAGE_GAP + GUTTER : 0,
      // Zoomed past the viewport the stack has to be wider than the scroller,
      // or there is nothing to scroll sideways into.
      width: Math.max(box.w, widest + GUTTER * 2),
    };
  }, [sizes, box.w, zoom]);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const currentRef = useRef(1);
  currentRef.current = current;

  // Which pages to paint, and which page the reader is on. Both fall out of the
  // scroll offset and the layout, so no per-page observer is needed.
  const measure = useCallback(() => {
    const el = containerRef.current;
    const { items } = layoutRef.current;
    if (!el || !items.length) return;

    const { scrollTop, clientHeight } = el;
    const windowTop = scrollTop - clientHeight * OVERSCAN;
    const windowBottom = scrollTop + clientHeight * (1 + OVERSCAN);

    let start = 0;
    while (start < items.length - 1 && items[start].top + items[start].height < windowTop) start += 1;
    let end = start;
    while (end < items.length - 1 && items[end + 1].top <= windowBottom) end += 1;
    setRange((r) => (r.start === start && r.end === end ? r : { start, end }));

    // The page under a line a third of the way down the viewport — the one
    // being read, rather than whichever one happens to touch the top edge.
    const marker = scrollTop + Math.min(clientHeight * 0.35, 220);
    let index = items.findIndex((it) => it.top + it.height >= marker);
    if (index < 0) index = items.length - 1;
    setCurrent(index + 1);
  }, []);

  // Scroll fires far more often than the painted window can change; a frame is
  // plenty, and coalescing keeps a fast flick off the render path.
  const frameRef = useRef(0);
  const onScroll = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      measure();
    });
  }, [measure]);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Keep a point in the document under a fixed point on screen across a zoom
  // step, instead of jumping back to wherever the raw scroll offset now lands.
  // `point` is viewport-relative (offset from the scroller's own top-left) —
  // defaulting to the top-left corner reproduces the old top-anchored
  // behaviour for the buttons, keyboard and wheel; pinch-zoom below passes the
  // two fingers' midpoint instead, so the spot being pinched stays put.
  const anchorRef = useRef(null);
  const zoomTo = useCallback((next, point = { offsetX: 0, offsetY: 0 }) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 20) / 20));
    const el = containerRef.current;
    const { items, width: layoutWidth } = layoutRef.current;
    if (el && items.length) {
      const targetY = el.scrollTop + point.offsetY;
      // The page actually under the anchor point — NOT currentRef's page
      // number, which tracks a marker near the top of the viewport for the
      // page counter and disagrees with the anchor point constantly (e.g.
      // pinching something lower on the page, or on a page other than
      // whichever one the counter currently names).
      let index = items.findIndex((it) => targetY <= it.top + it.height);
      if (index === -1) index = items.length - 1;
      const item = items[index];
      const itemLeft = (layoutWidth - item.width) / 2; // pages are centered — see PageView
      anchorRef.current = {
        index,
        withinY: (targetY - item.top) / (item.height || 1),
        withinX: (el.scrollLeft + point.offsetX - itemLeft) / (item.width || 1),
        offsetX: point.offsetX,
        offsetY: point.offsetY,
      };
    }
    setZoom(clamped);
  }, []);
  const zoomBy = useCallback((factor) => zoomTo(zoom * factor), [zoom, zoomTo]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const anchor = anchorRef.current;
    if (anchor) {
      anchorRef.current = null;
      const item = layout.items[anchor.index];
      if (el && item) {
        const itemLeft = (layout.width - item.width) / 2;
        el.scrollTop = item.top + anchor.withinY * item.height - anchor.offsetY;
        el.scrollLeft = itemLeft + anchor.withinX * item.width - anchor.offsetX;
      }
    }
    measure();
  }, [layout, measure]);

  // Ctrl/⌘ + wheel is pinch-zoom on a trackpad and the zoom gesture every PDF
  // reader answers to; without this it zooms the whole page instead.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, zoomTo, doc]);

  // Two-finger pinch on touch devices — the gesture most readers reach for
  // first, and on tablets (the primary device for a lot of students) the only
  // one available at all. Left alone, a pinch here is caught by the OS/browser
  // as a whole-page zoom, which just upscales the already-rendered canvas
  // pixels; touch-action below stops that so this handler can re-render the
  // page at the new resolution instead (see the render-at-zoomed-resolution
  // note in PageView), which is what actually keeps text sharp.
  //
  // zoomRef mirrors `zoom` so the gesture can read its live value without the
  // effect depending on `zoom` itself — that dependency would re-attach the
  // listeners on every frame of the pinch (setZoom fires continuously) and
  // wipe pinchRef's in-progress state mid-gesture.
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinchRef = useRef(null);
  // The page stack itself, so a live pinch can be previewed with a plain CSS
  // transform instead of a real re-render — see the effect below.
  const stackRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !doc) return;

    const distance = (touches) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

    const midpoint = (touches) => {
      const rect = el.getBoundingClientRect();
      return {
        offsetX: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        offsetY: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
      };
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }
      const point = midpoint(e.touches);
      const stack = stackRef.current;
      if (stack) {
        // Fixed for the whole gesture, not recomputed per frame: the origin
        // is where the CSS scale below visually pivots from, and re-pinning
        // it to the fingers' current position every frame would make the
        // preview jump instead of track smoothly. It's expressed in content
        // space (scroll position + offset) because the stack itself never
        // moves — only its transform changes — so this stays correct even
        // though the two fingers can drift a little during the gesture.
        stack.style.transformOrigin = `${el.scrollLeft + point.offsetX}px ${el.scrollTop + point.offsetY}px`;
        stack.style.willChange = 'transform';
      }
      pinchRef.current = { startDistance: distance(e.touches), startZoom: zoomRef.current, point, ratio: 1, frame: 0 };
    };

    const onTouchMove = (e) => {
      const pinch = pinchRef.current;
      if (e.touches.length !== 2 || !pinch) return;
      // Must run for every 2-finger move, not just the throttled visual
      // update below — skipping a frame here re-enables native zoom for it.
      e.preventDefault();
      pinch.ratio = distance(e.touches) / pinch.startDistance;
      if (pinch.frame) return;
      pinch.frame = requestAnimationFrame(() => {
        pinch.frame = 0;
        // A CSS transform tracks the fingers at full frame rate for free —
        // no layout, no canvas paint. The expensive part (PDF.js re-rendering
        // every visible page's canvas at the new resolution, in PageView)
        // only happens once, in onTouchEnd below, which is what actually
        // made this sluggish before: a real re-render on every touchmove.
        const stack = stackRef.current;
        if (stack) stack.style.transform = `scale(${pinch.ratio})`;
      });
    };

    const settle = () => {
      const pinch = pinchRef.current;
      if (!pinch) return;
      pinchRef.current = null;
      if (pinch.frame) cancelAnimationFrame(pinch.frame);
      const stack = stackRef.current;
      if (stack) {
        stack.style.transform = '';
        stack.style.transformOrigin = '';
        stack.style.willChange = '';
      }
      // The one real re-render for this gesture, anchored to the same point
      // the live preview was scaling around — so nothing jumps, it just goes
      // from a scaled preview to a freshly painted, sharp page.
      zoomTo(pinch.startZoom * pinch.ratio, pinch.point);
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) settle();
    };

    // pan-x/pan-y (not "auto", not "manipulation"): single-finger scrolling
    // stays native in both directions, but pinch-zoom is excluded, so the
    // browser leaves two-finger gestures on this element for the handlers
    // above instead of zooming the page.
    el.style.touchAction = 'pan-x pan-y';
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      if (pinchRef.current?.frame) cancelAnimationFrame(pinchRef.current.frame);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [zoomTo, doc]);

  useEffect(() => {
    const onKey = (e) => {
      const el = containerRef.current;
      if (!el) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      const step = 80;
      switch (e.key) {
        case 'ArrowDown':
          el.scrollBy({ top: step });
          break;
        case 'ArrowUp':
          el.scrollBy({ top: -step });
          break;
        case 'ArrowRight':
          el.scrollBy({ left: step });
          break;
        case 'ArrowLeft':
          el.scrollBy({ left: -step });
          break;
        case 'PageDown':
        case ' ':
          el.scrollBy({ top: el.clientHeight * 0.9, behavior: 'smooth' });
          break;
        case 'PageUp':
          el.scrollBy({ top: -el.clientHeight * 0.9, behavior: 'smooth' });
          break;
        case 'Home':
          el.scrollTo({ top: 0 });
          break;
        case 'End':
          el.scrollTo({ top: el.scrollHeight });
          break;
        case '+':
        case '=':
          zoomBy(1.25);
          break;
        case '-':
          zoomBy(0.8);
          break;
        case '0':
          zoomTo(1);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomBy, zoomTo]);

  if (errored) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">This note could not be displayed.</p>
        <p className="text-[11px] text-slate-400 mt-2 max-w-xs break-words">{errored}</p>
      </div>
    );
  }

  const ready = Boolean(doc) && sizes.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        onScroll={onScroll}
        tabIndex={0}
        // min-h-0 is load-bearing: without it a flex item is floored at its
        // content's height, and this one's content is the whole page stack —
        // often 20,000px. Safari applies that floor more eagerly than Chrome,
        // so the scroller grew instead of scrolling and pushed the control bar
        // off the bottom of an iPad's screen.
        className="flex-1 min-h-0 overflow-auto outline-none overscroll-contain"
        // Removes the "Save image as" entry on the rendered pages. A deterrent,
        // not a control — see the note at the top of this file.
        onContextMenu={(e) => e.preventDefault()}
      >
        {!ready ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading note…</p>
          </div>
        ) : (
          <div ref={stackRef} className="relative" style={{ height: layout.height, width: layout.width }}>
            {layout.items.map((item, i) =>
              i >= range.start && i <= range.end ? (
                <PageView
                  key={i}
                  doc={doc}
                  pageNumber={i + 1}
                  top={item.top}
                  width={item.width}
                  height={item.height}
                  scale={item.scale}
                  title={title}
                />
              ) : null
            )}
          </div>
        )}
      </div>

      {ready && (
        <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 tabular-nums min-w-[92px] text-center">
            Page {current} of {sizes.length}
          </span>

          <span className="w-px h-5 bg-slate-200 mx-1" />

          <button
            onClick={() => zoomBy(0.8)}
            disabled={zoom <= ZOOM_MIN}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 tabular-nums min-w-[46px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => zoomBy(1.25)}
            disabled={zoom >= ZOOM_MAX}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {/* Always mounted, disabled at 100%: appearing only above it moved
              the zoom buttons out from under the cursor mid-click. */}
          <button
            onClick={() => zoomTo(1)}
            disabled={zoom === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Fit width"
            title="Fit width"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
