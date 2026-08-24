import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getNotes, getNoteFile } from '@/api/noteService';
import { FileText, ChevronLeft, AlertCircle, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { PdfViewer } from '@/components/PdfViewer';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Deliberately no file size: it is an implementation detail of how the note is
// stored, and after compression the stored size bears no relation to what the
// student is reading. The API does not send it to students either.
//
// page_count is best-effort on the backend and null for some PDFs, so it is
// omitted rather than shown empty.
const metaLine = (note) => (note.page_count ? `${note.page_count} pages` : '');

// ── Sub-components ────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

const NoteCard = ({ note, onOpen }) => (
  <button
    onClick={() => onOpen(note)}
    className="group relative text-left bg-white rounded-2xl border border-slate-200 p-6 flex flex-col
               shadow-[0_1px_2px_rgba(15,23,42,0.04)]
               hover:shadow-[0_12px_28px_-12px_rgba(79,70,229,0.35)] hover:border-violet-200
               hover:-translate-y-0.5 transition-all duration-200"
  >
    {/* Hairline of brand colour that only appears on hover — enough to make the
        card feel alive without colouring the whole grid. */}
    <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent
                     opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center
                    justify-center mb-5 shadow-sm shadow-violet-500/20">
      <FileText className="w-5 h-5 text-white" />
    </div>

    <h2 className="font-semibold text-[15px] text-slate-900 leading-snug group-hover:text-violet-700 transition-colors">
      {note.title}
    </h2>

    {note.description && (
      <p className="text-sm text-slate-500 mt-2 mb-5 leading-relaxed line-clamp-2">{note.description}</p>
    )}

    {/* mt-auto so the meta row sits on the bottom edge of every card — grid
        stretches cards to equal height, and without this the footer floats at a
        different height on cards that have no description. */}
    <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
      {metaLine(note) ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500
                         bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
          <BookOpen className="w-3 h-3 text-slate-400" />
          {metaLine(note)}
        </span>
      ) : <span />}

      <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
        Read
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </div>
  </button>
);

/**
 * NoteViewer
 *
 * Fetches the PDF with axios so the auth header is sent, then hands the raw
 * bytes to PdfViewer, which draws them to a canvas. Nothing here creates a
 * blob: URL or an <iframe>, so the page never holds a saveable PDF.
 *
 * Every copy the server sends is watermarked with the account's email, which is
 * what makes a leaked screenshot traceable. See PdfViewer for what this does
 * and does not prevent.
 */
const NoteViewer = ({ note, onBack }) => {
  const [data, setData] = useState(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErrored(false);

    getNoteFile(note.id)
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setErrored(true));

    return () => {
      cancelled = true;
    };
  }, [note.id]);

  return (
    // Height is split by breakpoint so the control bar lands on the actual
    // bottom edge of the viewport. The layout reserves 4rem for its header
    // always, plus another 4rem for the mobile bottom nav — which md:pb-0
    // removes on desktop. Subtracting 8rem everywhere left a dead 4rem strip
    // below the controls on large screens.
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
          aria-label="Back to all notes"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-slate-900 truncate">{note.title}</h1>
          {metaLine(note) && <p className="text-[11px] text-slate-400">{metaLine(note)}</p>}
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
        {errored ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">This note could not be loaded.</p>
            <button onClick={onBack} className="mt-3 text-xs font-medium text-violet-600 hover:underline">
              Back to all notes
            </button>
          </div>
        ) : !data ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading note…</p>
          </div>
        ) : (
          <PdfViewer data={data} title={note.title} />
        )}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    getNotes()
      .then((res) => setNotes(res.data ?? []))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Opening a note collapses the sidebar to an icon rail: while a student is
    // reading, the nav is the thing most likely to pull their eye off the page,
    // and the width it gives back goes straight into the page. Closing the note
    // brings it back.
    <DashboardLayout active="notes" collapseNav={!!active}>
      {active ? (
        <NoteViewer note={active} onBack={() => setActive(null)} />
      ) : (
        <div className="min-h-full bg-slate-50 py-6 px-4">
          <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
            <p className="text-sm text-slate-500 mt-1">
              Study notes written by specialist doctors, to read alongside your practice.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <Skeleton className="w-11 h-11 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : errored ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Notes could not be loaded right now.</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No notes published yet</p>
              <p className="text-sm text-slate-400 mt-1">They will appear here as soon as they are added.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onOpen={setActive} />
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
