/**
 * PdfViewer
 *
 * Renders a PDF to a <canvas> with PDF.js instead of handing it to the
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
 * One page is rendered at a time. A 32-page note held entirely in canvases
 * would cost well over 100MB of memory on a phone.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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

export const PdfViewer = ({ data, title }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const docRef = useRef(null);
  const renderTaskRef = useRef(null);
  // Read inside renderPage, which is memoised with an empty dependency list —
  // a ref keeps it seeing the current zoom without rebuilding the callback (and
  // re-triggering every effect that depends on it) on each zoom step.
  const zoomRef = useRef(1);
  // Monotonic token identifying the newest requested render. Anything older
  // that wakes up from an await must bail out — see renderPage.
  const renderSeq = useRef(0);

  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  // 1 = the whole page fitted to the container. Above that the container
  // scrolls, which is the point: notes with small print need magnifying.
  const [zoom, setZoom] = useState(1);
  const [errored, setErrored] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the document once per payload.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    setReady(false);
    setErrored(false);
    setPage(1);

    // One worker per document — see the note above GlobalWorkerOptions.
    const worker = new pdfjsLib.PDFWorker({ port: new PdfWorker() });

    // PDF.js takes ownership of the buffer it is given and detaches it, which
    // would break a re-render from the same response. A copy keeps the original
    // intact.
    const task = pdfjsLib.getDocument({ data: data.slice(0), worker });

    task.promise
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setPageCount(doc.numPages);
        setReady(true);
      })
      .catch(() => !cancelled && setErrored(true));

    return () => {
      cancelled = true;
      docRef.current = null;

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

  const renderPage = useCallback(async (pageNumber) => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container) return;

    // Holding arrow-down runs this faster than a page can render. Cancelling
    // the previous task is not enough on its own: getPage() below is async, so
    // two calls can both get past the cancel and then draw to the same canvas,
    // which throws "Cannot use the same canvas during multiple render
    // operations" and blanks the viewer. The sequence token makes every
    // superseded call return instead.
    const seq = ++renderSeq.current;

    const previous = renderTaskRef.current;
    if (previous) {
      previous.cancel();
      // Wait for the cancellation to actually settle before touching the
      // canvas, or the old render can still be mid-write when the new one
      // starts.
      await previous.promise.catch(() => {});
    }

    const pdfPage = await doc.getPage(pageNumber);
    if (seq !== renderSeq.current) return;

    const unscaled = pdfPage.getViewport({ scale: 1 });

    // Fit the WHOLE page into the container — width and height both — so a
    // page is read by paging, not by scrolling within a page. Fitting width
    // alone overflows a portrait page vertically and makes the pager useless.
    // Then multiply by the device pixel ratio so text is sharp on retina
    // screens rather than soft.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fitScale = Math.min(
      (container.clientWidth - 24) / unscaled.width,
      (container.clientHeight - 24) / unscaled.height
    );
    // Rendered at the zoomed resolution rather than CSS-scaled up, so magnified
    // text stays sharp instead of turning into enlarged pixels.
    const scale = Math.max(fitScale, 0.1) * zoomRef.current;
    const viewport = pdfPage.getViewport({ scale: scale * dpr });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;

    const task = pdfPage.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
    });
    renderTaskRef.current = task;

    try {
      await task.promise;
      if (seq === renderSeq.current) setErrored(false);
    } catch (err) {
      // A cancelled render is the expected outcome of paging quickly, and a
      // superseded one is no longer anyone's concern — neither is a failure to
      // report.
      if (err?.name !== 'RenderingCancelledException' && seq === renderSeq.current) {
        setErrored(true);
      }
    }
  }, []);

  useEffect(() => {
    if (ready) renderPage(page);
  }, [ready, page, renderPage]);

  // Re-render at the new resolution when the zoom changes.
  useEffect(() => {
    zoomRef.current = zoom;
    if (ready) renderPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // A new page should start at the top-left rather than wherever the previous
  // page happened to be scrolled to.
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [page]);

  // Re-render on resize so the page keeps filling the width.
  useEffect(() => {
    if (!ready) return;
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderPage(page), 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, [ready, page, renderPage]);

  const go = useCallback(
    (delta) => setPage((p) => Math.min(Math.max(p + delta, 1), pageCount || 1)),
    [pageCount]
  );

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const zoomBy = useCallback(
    (factor) =>
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * factor * 20) / 20))),
    []
  );

  useEffect(() => {
    const onKey = (e) => {
      // Arrows scroll the magnified page instead of paging, or a zoomed-in
      // reader could never reach the right-hand side of a page.
      if (zoom === 1 && (e.key === 'ArrowRight' || e.key === 'PageDown')) go(1);
      if (zoom === 1 && (e.key === 'ArrowLeft' || e.key === 'PageUp')) go(-1);
      if (e.key === '+' || e.key === '=') zoomBy(1.25);
      if (e.key === '-') zoomBy(0.8);
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, zoom, zoomBy]);

  if (errored) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">This note could not be displayed.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3"
        // Removes the "Save image as" entry on the rendered page. A deterrent,
        // not a control — see the note at the top of this file.
        onContextMenu={(e) => e.preventDefault()}
      >
        {!ready ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading note…</p>
          </div>
        ) : (
          // m-auto rather than a flex-centred parent: a flex child that
          // overflows its container cannot be scrolled back to its left edge,
          // so at high zoom the left of the page became unreachable.
          <canvas
            ref={canvasRef}
            aria-label={`${title} — page ${page} of ${pageCount}`}
            className="shadow-sm rounded-lg select-none m-auto"
            draggable={false}
          />
        )}
      </div>

      {ready && (
        <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-t border-slate-100">
          <button
            onClick={() => go(-1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 tabular-nums min-w-[92px] text-center">
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => go(1)}
            disabled={page >= pageCount}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1" />

          <button
            onClick={() => zoomBy(0.8)}
            disabled={zoom <= ZOOM_MIN}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
            className="text-xs text-slate-500 tabular-nums min-w-[46px] text-center hover:text-slate-700 disabled:hover:text-slate-500 transition"
            aria-label="Reset zoom to fit page"
            title="Fit page"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => zoomBy(1.25)}
            disabled={zoom >= ZOOM_MAX}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
              aria-label="Fit page"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
