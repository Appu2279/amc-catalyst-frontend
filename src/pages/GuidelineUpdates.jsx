import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpenCheck, FileText, Lock, ScrollText, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getGuidelineUpdates } from '@/api/noteService';
import { useAccess } from '@/hooks/useAccess';
import { NoteViewer } from '@/pages/Notes';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const GuidelineCard = ({ doc, locked, onOpen }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${locked ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-700'}`}>
      <ScrollText className="h-6 w-6" />
    </span>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold text-slate-900">{doc.title}</h2>
        {doc.is_free && (
          <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">FREE</span>
        )}
      </div>
      {doc.description && <p className="mt-1 text-sm text-slate-500">{doc.description}</p>}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
        {doc.page_count && (
          <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {doc.page_count} pages</span>
        )}
        {formatDate(doc.createdAt) && <span>Added {formatDate(doc.createdAt)}</span>}
      </p>
    </div>

    {locked ? (
      <Link
        to="/pricing"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
      >
        <Lock className="h-4 w-4" /> Unlock with a plan
      </Link>
    ) : (
      <button
        onClick={() => onOpen(doc)}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
      >
        <BookOpenCheck className="h-4 w-4" /> Read
      </button>
    )}
  </div>
);

/**
 * Guideline Updates: PDFs open to anyone holding any plan, whatever sections
 * it grants. An admin can mark one free for every signed-in student. Same
 * private storage and watermarked viewer as Notes; the server makes the real
 * access decision, this page only mirrors it.
 */
export const GuidelineUpdates = () => {
  const { hasPlan, loading: accessLoading } = useAccess();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    getGuidelineUpdates()
      .then((res) => setDocs(res.data ?? []))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, []);

  // Until access is known, nothing reads as locked — no paywall flash for a paying student.
  const isLocked = (doc) => !accessLoading && !hasPlan && !doc.is_free;
  const anyLocked = docs.some(isLocked);

  return (
    <DashboardLayout active="guidelines" collapseNav={!!active}>
      {active ? (
        <div className="p-4 sm:p-6">
          <NoteViewer note={active} onBack={() => setActive(null)} backLabel="Back to Guideline Updates" />
        </div>
      ) : (
        <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="relative">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-teal-200">
                  <ScrollText className="h-3.5 w-3.5" /> Included with every plan
                </span>
                <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">Guideline Updates</h1>
                <p className="mt-2 max-w-xl text-xs font-medium text-teal-100 sm:text-sm">
                  The latest changes to clinical guidelines, summarised for the AMC exam.
                </p>
              </div>
            </div>

            {!loading && anyLocked && (
              <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-3 text-sm text-slate-700">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <span>
                    <span className="font-bold text-slate-900">Every plan includes Guideline Updates.</span>{' '}
                    <span className="text-slate-500">Get any plan to read them.</span>
                  </span>
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-teal-800"
                >
                  See plans <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />)}
              </div>
            ) : errored ? (
              <div className="flex flex-col items-center py-16 text-center">
                <AlertCircle className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Guideline Updates could not be loaded right now.</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <ScrollText className="mb-3 h-8 w-8 text-slate-300" />
                <p className="font-medium text-slate-500">Nothing here yet</p>
                <p className="mt-1 text-sm text-slate-400">Guideline updates will appear here as soon as they are added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((doc) => (
                  <GuidelineCard key={doc.id} doc={doc} locked={isLocked(doc)} onOpen={setActive} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
