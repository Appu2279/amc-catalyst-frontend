import React, { useEffect, useState } from 'react';
import { AlertCircle, Presentation } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { LockedSection } from '@/components/LockedSection';
import { getClassPresentations } from '@/api/noteService';
import { useAccess } from '@/hooks/useAccess';
import { NoteViewer } from '@/pages/Notes';
import { RouteMapCard } from '@/pages/RouteMap';

/**
 * Slides from the online classes (uploaded from Admin → Class Presentations).
 * Only plans with the 'online_classes' section (AMC Full Course) can open them;
 * the backend enforces that on every file request.
 */
export const ClassPresentations = () => {
  const { sections, loading: accessLoading } = useAccess();
  const isEnabled = Boolean(sections.online_classes);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!isEnabled) return;
    getClassPresentations()
      .then((res) => setDocs(res.data ?? []))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, [isEnabled]);

  let content;
  if (accessLoading || (isEnabled && loading)) {
    content = <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />;
  } else if (!isEnabled) {
    content = (
      <LockedSection
        section="online_classes"
        title="Class Presentations"
        body="The slides from every live online class, ready to revise from. Included with the AMC Full Course."
      />
    );
  } else if (errored) {
    content = (
      <div className="flex flex-col items-center py-16 text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">The class presentations could not be loaded right now.</p>
      </div>
    );
  } else if (docs.length === 0) {
    content = (
      <div className="flex flex-col items-center py-20 text-center">
        <Presentation className="mb-3 h-8 w-8 text-slate-300" />
        <p className="font-medium text-slate-500">Nothing here yet</p>
        <p className="mt-1 text-sm text-slate-400">Slides will appear here after each class.</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-3">
        {docs.map((doc) => <RouteMapCard key={doc.id} doc={doc} onOpen={setActive} icon={Presentation} />)}
      </div>
    );
  }

  return (
    <DashboardLayout active="class-presentations" collapseNav={!!active}>
      {active ? (
        <div className="p-4 sm:p-6">
          <NoteViewer note={active} onBack={() => setActive(null)} backLabel="Back to Class Presentations" />
        </div>
      ) : (
        <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
              <span className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-violet-300">
                <Presentation className="h-3.5 w-3.5" /> Online classes
              </span>
              <h1 className="relative text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                Class Presentations
              </h1>
              <p className="relative mt-2 max-w-2xl text-xs font-medium text-slate-300 sm:text-sm">
                The slides from your AMC Full Course online classes, to revise from at any time.
              </p>
            </div>

            {content}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
