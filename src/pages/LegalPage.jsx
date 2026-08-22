/**
 * Renders a legal document (Terms, Privacy Policy) from the block data in
 * content/legal.js.
 *
 * Section and clause numbers are derived at render time rather than baked into
 * the text, so inserting or removing a clause cannot leave the document
 * misnumbered — the original .docx relied on Word's automatic numbering, which
 * does not survive a plain text extraction.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED } from '@/content/legal';

const numberBlocks = (blocks) => {
  let section = 0;
  let clause = 0;
  return blocks.map((b) => {
    if (b.t === 'h2') {
      section += 1;
      clause = 0;
      return { ...b, n: `${section}` };
    }
    if (b.t === 'clause') {
      clause += 1;
      return { ...b, n: `${section}.${clause}` };
    }
    return b;
  });
};

export const LegalPage = ({ doc }) => {
  const blocks = useMemo(() => numberBlocks(doc.blocks), [doc]);

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <header className="pb-8 mb-8 border-b border-slate-200">
          <p className="text-xs font-semibold tracking-widest text-brand-violet uppercase mb-2">
            AMC Catalyst
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
            {doc.title}
          </h1>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-slate-400">Version</dt>
              <dd className="font-medium text-slate-600">{doc.version}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-400">Effective date</dt>
              <dd className="font-medium text-slate-600">{LEGAL_EFFECTIVE_DATE}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-400">Last updated</dt>
              <dd className="font-medium text-slate-600">{LEGAL_LAST_UPDATED}</dd>
            </div>
          </dl>
        </header>

        <article className="space-y-4">
          {blocks.map((b, i) => {
            if (b.t === 'h2') {
              return (
                <h2
                  key={i}
                  className="text-xl font-bold text-brand-dark pt-8 first:pt-0 scroll-mt-24"
                  id={`section-${b.n}`}
                >
                  <span className="text-brand-violet">{b.n}.</span> {b.x}
                </h2>
              );
            }
            if (b.t === 'h3') {
              return (
                <h3 key={i} className="text-base font-semibold text-slate-800 pt-4">
                  {b.x}
                </h3>
              );
            }
            if (b.t === 'clause') {
              return (
                <p key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-600">
                  <span className="shrink-0 font-semibold text-slate-400 tabular-nums">{b.n}</span>
                  <span>{b.x}</span>
                </p>
              );
            }
            if (b.t === 'li') {
              return (
                <p key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-600 pl-6">
                  <span className="shrink-0 text-slate-300">•</span>
                  <span>{b.x}</span>
                </p>
              );
            }
            return (
              <p key={i} className="text-[15px] leading-relaxed text-slate-600">
                {b.x}
              </p>
            );
          })}
        </article>

        <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/terms" className="text-brand-violet hover:underline font-medium">
            Terms and Conditions
          </Link>
          <Link to="/privacy" className="text-brand-violet hover:underline font-medium">
            Privacy Policy
          </Link>
          <Link to="/contact" className="text-slate-400 hover:text-slate-600">
            Contact us
          </Link>
        </footer>
      </div>
    </div>
  );
};
