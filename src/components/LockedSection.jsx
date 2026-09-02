import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { getCourses } from '@/api/courseService';

/**
 * What a student sees where a section they have not paid for would be.
 *
 * Deliberately not styled as an error. The obvious way to build this — a grey
 * padlock on an empty page — borrows the visual language of "something went
 * wrong", and a student reads it as the product being broken or stingy rather
 * than as an offer. So this is the shop window: it names what is behind the
 * glass, shows the real price, and gives one clear way in.
 *
 * It is not a security boundary. Every gated endpoint checks entitlement
 * server-side; this only explains the refusal and gives it somewhere to go.
 */

const money = (value) =>
  `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * The cheapest plan that actually grants this section.
 *
 * Resolved through the tier chain, because a plan lists only what it adds — so
 * "Premium" grants notes without saying so, via Standard, via Notes Only.
 * Showing one blanket "from ₹4,999" across every section would be a lie on the
 * notes page, where the real entry price is ₹21,999.
 */
const cheapestPlanFor = (section, courses) => {
  const byId = new Map(courses.map((c) => [c.id, c]));

  const grants = (course) => {
    const seen = new Set();
    let current = course;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      if ((current.sections ?? []).includes(section)) return true;
      current = byId.get(current.inherits_from_course_id);
    }
    return false;
  };

  const priceOf = (course) => {
    const p = (course.CoursePricings ?? [])[0] ?? {};
    return p.discounted_price ?? p.actual_price ?? null;
  };

  return courses
    .filter((c) => c.is_active !== false && grants(c) && priceOf(c) !== null)
    .sort((a, b) => priceOf(a) - priceOf(b))[0] ?? null;
};

export const LockedSection = ({ section, title, body, highlights = [], sampleCount = 0 }) => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCourses()
      .then((res) => {
        if (cancelled) return;
        setPlan(cheapestPlanFor(section, res.data ?? []));
      })
      .catch(() => {
        // The pitch still works without a price; it just loses the anchor.
        if (!cancelled) setPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const price = plan
    ? (plan.CoursePricings ?? [])[0]?.discounted_price ??
      (plan.CoursePricings ?? [])[0]?.actual_price
    : null;

  return (
    <div className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(79,70,229,0.35)]">
        {/* A band of brand colour rather than a grey lock: this is an offer, and
            it should look like the pricing page, not like a 403. */}
        <div className="bg-gradient-brand px-8 py-9 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Included with a plan
          </span>

          <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">{body}</p>
        </div>

        <div className="px-8 py-7">
          {highlights.length > 0 && (
            <ul className="mb-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 stroke-[3] text-brand-violet" />
                  <span className="text-[13px] font-medium leading-snug text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* The price is on the page rather than one click away. "See plans"
                asks a student to go and find out what it costs before they know
                whether it is worth finding out. */}
            <div className="text-center sm:text-left">
              {price ? (
                <>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {plan.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {money(price)}
                    <span className="ml-1.5 text-xs font-medium text-slate-400">
                      for {plan.duration_months} months
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">See plans for pricing</p>
              )}
            </div>

            <Link
              to={plan ? `/checkout/${plan.id}` : '/pricing'}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-violet px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-violet/25 transition hover:bg-brand-violet-hover sm:w-auto"
            >
              Unlock now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2 border-t border-slate-100 pt-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <Link to="/pricing" className="text-xs font-semibold text-slate-500 hover:text-brand-violet">
              Compare all plans
            </Link>
            {sampleCount > 0 && (
              <p className="text-xs text-slate-400">
                {sampleCount} free {sampleCount === 1 ? 'sample' : 'samples'} available to try first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Copy per section, in one place so four pages cannot drift into describing the
 * same paywall four different ways.
 *
 * Written as what the student gets, not what they are missing — "2,500+ MCQs
 * with worked explanations" sells; "you do not have access" does not.
 */
export const LOCKED_COPY = {
  notes: {
    section: 'notes',
    title: 'Complete AMC notes, written by specialists',
    body: 'Every subject, condensed into high-yield notes you can read alongside your practice.',
    highlights: [
      'All subjects covered',
      'High-yield one-liners',
      'Image-based learning',
      'Read on any device',
    ],
  },
  qbank: {
    section: 'qbank',
    title: '2,500+ MCQs with worked explanations',
    body: 'Subject-wise practice with the reasoning spelled out — not just the right answer.',
    highlights: [
      '2,500+ structured MCQs',
      'Filter by subject and topic',
      'Explanation on every question',
      'Progress saved across devices',
    ],
  },
  recall: {
    section: 'recall',
    title: 'Recalls from candidates who just sat the exam',
    body: 'Questions remembered from recent sittings, grouped by month and updated as new ones arrive.',
    highlights: [
      '10 months of recalls',
      'Monthly updates',
      'Grouped by exam sitting',
      'Explanations included',
    ],
  },
  mocks: {
    section: 'mocks',
    title: 'Full-length timed mock exams',
    body: 'Sit a real exam under real conditions, then see exactly where the marks went.',
    highlights: [
      'Timed, exam-length papers',
      'Subject-wise breakdown',
      'Track scores over time',
      'Review every answer',
    ],
  },
};
