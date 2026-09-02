import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Shown to a student who has not paid for a section but can see its samples.
 *
 * Amber was wrong here. It is the colour this app uses for "payment under
 * review" and for overdue queues — a caution signal — and a student reading it
 * concludes something is wrong rather than that they have been given something.
 * Brand violet says "this is the product", which is the feeling that sells it.
 *
 * The point of a sample is that it ends. Without saying so, a student who works
 * through three questions concludes the product is thin rather than that they
 * have reached the edge of the free part.
 */
export const SampleBanner = ({ count, noun = 'questions' }) => (
  <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50">
    <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-violet">
          <Sparkles className="h-3 w-3 text-white" />
        </span>
        <p className="text-sm text-slate-700">
          <span className="font-bold text-slate-900">
            You are trying {count} free {count === 1 ? noun.replace(/s$/, '') : noun}.
          </span>{' '}
          <span className="text-slate-500">
            Members get the full set, with explanations on every one.
          </span>
        </p>
      </div>

      <Link
        to="/pricing"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-violet px-4 py-1.5 text-sm font-bold text-white shadow-sm shadow-brand-violet/25 transition hover:bg-brand-violet-hover"
      >
        Unlock all
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  </div>
);
