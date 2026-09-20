import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getNotes, getNoteFile } from '@/api/noteService';
import {
  BookOpen, ChevronLeft, AlertCircle, Loader2, ArrowRight, Lock, Sparkles, Search, X,
} from 'lucide-react';
import { PdfViewer } from '@/components/PdfViewer';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Link } from 'react-router-dom';
import { useAccess } from '@/hooks/useAccess';

// ── Helpers ───────────────────────────────────────────────────────────────────

const metaLine = (note) => (note.page_count ? `${note.page_count}p` : '');

// A note without a cover still gets a distinct cloth-bound colour instead of
// every spine looking identical — picked deterministically from the id so it
// doesn't shift on every reload. Real shelves aren't monochrome, so this
// deliberately spans hue rather than shading one brand colour.
const BOOK_COLORS = [
  'from-rose-800 to-rose-950',
  'from-emerald-800 to-emerald-950',
  'from-blue-900 to-slate-950',
  'from-amber-700 to-amber-900',
  'from-teal-800 to-teal-950',
  'from-violet-800 to-violet-950',
  'from-orange-800 to-orange-950',
  'from-stone-600 to-stone-800',
];
const colorFor = (id) => BOOK_COLORS[Math.abs(Number(id) || 0) % BOOK_COLORS.length];

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const isRecent = (createdAt) => Boolean(createdAt) && Date.now() - new Date(createdAt).getTime() < NEW_WINDOW_MS;

// Book face-out dimensions, in px. The shelf background below is a
// repeating-gradient tuned against these exact numbers (book height, then the
// row-gap the books sit in) — change one, change the other.
const BOOK_W = 172;
const BOOK_H = 248;
const ROW_GAP = 80;
const ROW_CYCLE = BOOK_H + ROW_GAP;

// A wood shelf ledge drawn once, under every wrapped row, from a single CSS
// background — not a per-row DOM element, since flex-wrap doesn't expose row
// boundaries to lay one out explicitly. Because every book is the same
// height, each row is exactly ROW_CYCLE tall, so the stripe repeats in sync
// with the books above it no matter how many wrap per line.
const shelfBackground = {
  backgroundImage: `repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent ${BOOK_H + 6}px,
    rgba(30,20,10,0.28) ${BOOK_H + 6}px,
    rgba(30,20,10,0.28) ${BOOK_H + 12}px,
    #a8600f ${BOOK_H + 12}px,
    #c17a1f ${BOOK_H + 17}px,
    #7c4a10 ${BOOK_H + 21}px,
    rgba(0,0,0,0.3) ${BOOK_H + 24}px,
    transparent ${BOOK_H + 30}px,
    transparent ${ROW_CYCLE}px
  )`,
  backgroundRepeat: 'repeat-y',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/10 ${className}`} />
);

const Book = ({ note, onOpen, locked, isNew }) => (
  <button
    onClick={() => (locked ? null : onOpen(note))}
    aria-disabled={locked}
    title={locked ? 'Included with a plan' : note.title}
    style={{ width: BOOK_W, height: BOOK_H, transformOrigin: 'bottom center' }}
    className={`group relative text-left rounded-r-md rounded-l-[3px] overflow-hidden shrink-0
                shadow-[3px_6px_14px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out
                ${locked ? 'grayscale-[60%] opacity-80 cursor-default' : 'hover:-translate-y-2.5 hover:rotate-[-2deg] hover:shadow-[6px_20px_30px_rgba(0,0,0,0.45)] hover:z-20'}`}
  >
    {/* Cover art / cloth-bound fallback */}
    {note.has_cover ? (
      <ProtectedImage
        src={`/api/notes/${note.id}/cover`}
        alt={note.title}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className={`absolute inset-0 bg-gradient-to-b ${colorFor(note.id)}`}>
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-b border-white/20 py-4">
          <BookOpen className="w-8 h-8 text-white/70 mx-auto" />
        </div>
      </div>
    )}

    {/* Spine shadow (left edge) + page edge (right edge) — sells "book" even
        for the flat colour fallback. */}
    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/50 to-transparent" />
    <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-white/50 via-white/10 to-white/50 opacity-70" />

    {/* Title scrim */}
    <div className="absolute inset-x-0 bottom-0 pt-14 pb-3.5 px-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
      <p className="text-white text-[14px] font-bold leading-tight line-clamp-3 drop-shadow">
        {note.title}
      </p>
      {metaLine(note) && <p className="text-white/60 text-[11px] mt-1.5 font-medium">{metaLine(note)}</p>}
    </div>

    {/* Badges — free on the left, new/locked stacked on the right so they
        never collide even when a note is both new and locked. */}
    {note.is_free && (
      <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
        FREE
      </span>
    )}
    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
      {isNew && (
        <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow">
          <Sparkles className="w-2.5 h-2.5" /> NEW
        </span>
      )}
      {locked && (
        <div className="w-6 h-6 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center shadow">
          <Lock className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  </button>
);

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
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
          aria-label="Back to the shelf"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-slate-900 truncate">{note.title}</h1>
          {note.page_count && <p className="text-[11px] text-slate-400">{note.page_count} pages</p>}
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
        {errored ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">This note could not be loaded.</p>
            <button onClick={onBack} className="mt-3 text-xs font-medium text-amber-700 hover:underline">
              Back to the shelf
            </button>
          </div>
        ) : !data ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin mb-3" />
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
  const { sections, loading: accessLoading } = useAccess();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getNotes()
      .then((res) => setNotes(res.data ?? []))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const freeCount = notes.filter((n) => n.is_free).length;
  const hasNotes = !loading && !errored && notes.length > 0;

  return (
    <DashboardLayout active="notes" collapseNav={!!active}>
      {active ? (
        <div className="p-4 sm:p-6">
          <NoteViewer note={active} onBack={() => setActive(null)} />
        </div>
      ) : (
        <div className="min-h-full bg-gradient-to-b from-stone-100 to-stone-200/70 py-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-7">
            {/* ── Hero header ──────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-stone-950 via-[#231206] to-stone-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-900/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-orange-700/10 rounded-full blur-2xl pointer-events-none" />
              {/* Faint vertical "spine" ruling in the background, echoing a shelf */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 28px)' }}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300 mb-3">
                    <BookOpen className="w-3.5 h-3.5" /> Your Library
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Every note, right on the shelf
                  </h1>
                  <p className="text-stone-300 text-xs sm:text-sm font-medium mt-2 max-w-xl">
                    Specialist-written notes for the AMC exam. Browse the shelf, pull down what you
                    need.
                  </p>
                </div>

                {hasNotes && (
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-black text-white leading-none">{notes.length}</p>
                      <p className="text-[11px] font-medium text-stone-400 mt-1">on the shelf</p>
                    </div>
                    {freeCount > 0 && (
                      <div className="text-right border-l border-white/10 pl-4">
                        <p className="text-2xl font-black text-emerald-400 leading-none">{freeCount}</p>
                        <p className="text-[11px] font-medium text-stone-400 mt-1">free to read</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Search ───────────────────────────────────────────────────── */}
            {hasNotes && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the shelf…"
                  className="w-full bg-white border border-stone-300 rounded-2xl pl-11 pr-10 py-3 text-sm text-stone-700
                             placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2
                             focus:ring-amber-500/50 focus:border-amber-400 transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100
                               hover:bg-stone-200 flex items-center justify-center text-stone-400 transition"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex flex-wrap gap-x-6" style={{ rowGap: ROW_GAP }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="rounded-r-md rounded-l-[3px]" style={{ width: BOOK_W, height: BOOK_H }} />
                ))}
              </div>
            ) : errored ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-8 h-8 text-stone-400 mb-3" />
                <p className="text-sm text-stone-500">Notes could not be loaded right now.</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-stone-300" />
                </div>
                <p className="text-stone-500 font-medium">The shelf is empty</p>
                <p className="text-sm text-stone-400 mt-1">Notes will appear here as soon as they are added.</p>
              </div>
            ) : (
              <>
                {!accessLoading && !sections.notes && notes.some((n) => !n.is_free) && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600">
                        <Sparkles className="h-3 w-3 text-white" />
                      </span>
                      <p className="text-sm text-stone-700">
                        <span className="font-bold text-stone-900">
                          Specialist-written notes for every subject.
                        </span>{' '}
                        <span className="text-stone-500">
                          Free titles are open to everyone — the rest of the shelf comes with a plan.
                        </span>
                      </p>
                    </div>
                    <Link
                      to="/pricing"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm shadow-amber-600/25 transition hover:bg-amber-700"
                    >
                      Unlock the shelf
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="w-7 h-7 text-stone-300 mb-3" />
                    <p className="text-stone-500 font-medium">No notes match "{query}"</p>
                    <button
                      onClick={() => setQuery('')}
                      className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="flex flex-wrap gap-x-6 items-start"
                      style={{ ...shelfBackground, rowGap: ROW_GAP, paddingBottom: ROW_GAP }}
                    >
                      {filtered.map((note) => (
                        <Book
                          key={note.id}
                          note={note}
                          onOpen={setActive}
                          locked={!accessLoading && !sections.notes && !note.is_free}
                          isNew={isRecent(note.createdAt)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
