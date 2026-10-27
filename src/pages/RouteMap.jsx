import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpenCheck, FileText, Route, Workflow } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getPathwayGuidePdfs } from '@/api/noteService';
import { NoteViewer } from '@/pages/Notes';

const PATHWAY_PAGES = [
  { key: 'registration', to: '/pathway-guide', label: 'Guide', icon: Workflow },
  { key: 'route-map', to: '/pathway-guide/route-map', label: 'Route Map', icon: Route },
];

/**
 * Phones only. On desktop the sidebar lists both Pathway Guide pages, but the
 * bottom bar has no room for a second entry, so the pages link to each other.
 */
export const PathwayPageSwitch = ({ current }) => (
  <nav aria-label="Pathway Guide pages" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:hidden">
    {PATHWAY_PAGES.map(({ key, to, label, icon: Icon }) => {
      const isCurrent = key === current;
      return (
        <Link
          key={key}
          to={to}
          aria-current={isCurrent ? 'page' : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
            isCurrent ? 'bg-brand-violet text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" /> {label}
        </Link>
      );
    })}
  </nav>
);

const RouteMapCard = ({ doc, onOpen }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
      <Route className="h-6 w-6" />
    </span>
    <div className="min-w-0 flex-1">
      <h2 className="font-bold text-slate-900">{doc.title}</h2>
      {doc.description && <p className="mt-1 text-sm text-slate-500">{doc.description}</p>}
      {doc.page_count && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" /> {doc.page_count} pages
        </p>
      )}
    </div>
    <button
      onClick={() => onOpen(doc)}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-violet px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
    >
      <BookOpenCheck className="h-4 w-4" /> Read
    </button>
  </div>
);

/**
 * Route Map: the Pathway Guide's PDFs (uploaded from Admin → Pathway Guide),
 * open to every signed-in student like the rest of the guide.
 */
export const RouteMap = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    getPathwayGuidePdfs()
      .then((res) => setDocs(res.data ?? []))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout active="route-map" collapseNav={!!active}>
      {active ? (
        <div className="p-4 sm:p-6">
          <NoteViewer note={active} onBack={() => setActive(null)} backLabel="Back to Route Map" />
        </div>
      ) : (
        <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <PathwayPageSwitch current="route-map" />

            <div className="relative overflow-hidden rounded-3xl border border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
              <span className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
                <Route className="h-3.5 w-3.5" /> Route map
              </span>
              <h1 className="relative text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                Your whole AMC journey on one page
              </h1>
              <p className="relative mt-2 max-w-2xl text-xs font-medium text-slate-300 sm:text-sm">
                Every step from your first qualification check to practising in Australia, as a PDF
                you can come back to at any time.
              </p>
            </div>

            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
            ) : errored ? (
              <div className="flex flex-col items-center py-16 text-center">
                <AlertCircle className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">The route map could not be loaded right now.</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Route className="mb-3 h-8 w-8 text-slate-300" />
                <p className="font-medium text-slate-500">Nothing here yet</p>
                <p className="mt-1 text-sm text-slate-400">The route map will appear here as soon as it is added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((doc) => <RouteMapCard key={doc.id} doc={doc} onOpen={setActive} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
