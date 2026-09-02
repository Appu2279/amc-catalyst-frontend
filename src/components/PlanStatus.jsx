import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { getMyPaymentClaims } from '@/api/userService';

/**
 * The one place a student learns where they stand: what they hold, when it
 * runs out, and whether a payment they sent is still being checked.
 *
 * The pending-claim line matters more than it looks. Payments are verified by
 * hand against a bank statement, and the buyer is told to expect up to two
 * days — without somewhere to see that state, every one of them has to email
 * and ask, and the answer is a person reading a queue.
 */

const DAYS_UNTIL_EXPIRY_WARNING = 14;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

const Banner = ({ tone, icon: Icon, children, action }) => {
  const tones = {
    info: 'border-slate-200 bg-white text-slate-600',
    pending: 'border-amber-200 bg-amber-50 text-amber-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    active: 'border-slate-200 bg-white text-slate-600',
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${tones[tone]}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      {action}
    </div>
  );
};

const BuyLink = ({ label = 'See plans' }) => (
  <Link
    to="/pricing"
    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
  >
    {label}
  </Link>
);

export const PlanStatus = ({ subscriptions = [], loading }) => {
  const [pendingClaim, setPendingClaim] = useState(null);

  useEffect(() => {
    getMyPaymentClaims()
      .then((res) => {
        const claims = res.data ?? [];
        // Only a claim the buyer actually submitted is "under review" — one
        // created by opening the QR page and wandering off is not waiting on
        // anybody, and saying it is would be a promise nobody is keeping.
        setPendingClaim(
          claims.find((c) => c.status === 'pending' && c.submitted_at) ?? null
        );
      })
      .catch(() => setPendingClaim(null));
  }, []);

  if (loading) return null;

  // A submitted claim outranks everything else: it is the thing the student is
  // actively waiting on, and it explains why they still cannot open anything.
  if (pendingClaim) {
    return (
      <Banner tone="pending" icon={Clock}>
        <span className="font-semibold">Payment under review.</span>{' '}
        We are checking your transfer for{' '}
        <span className="font-semibold">{pendingClaim.course?.title ?? 'your plan'}</span>{' '}
        against our bank statement. Access usually opens within two working days — you do not
        need to pay again or send anything else.
      </Banner>
    );
  }

  // No plan is the most valuable surface on the dashboard: it is seen by every
  // student who has not bought yet, every time they log in. A grey sentence
  // wastes it, so this one states the offer instead of the deficiency.
  if (subscriptions.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
            <div>
              <p className="text-base font-bold">Unlock the full AMC Catalyst programme</p>
              <p className="mt-0.5 text-sm text-white/80">
                Notes, 2,500+ MCQs, monthly recalls and full-length mock exams — six months of
                access.
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-violet transition hover:bg-white/90"
          >
            See plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const soonest = [...subscriptions].sort((a, b) => a.days_remaining - b.days_remaining)[0];
  const expiringSoon = soonest.days_remaining <= DAYS_UNTIL_EXPIRY_WARNING;

  return (
    <Banner
      tone={expiringSoon ? 'warning' : 'active'}
      icon={expiringSoon ? AlertTriangle : ShieldCheck}
      action={expiringSoon ? <BuyLink label="Renew" /> : null}
    >
      <span className="font-semibold">{soonest.plan_title ?? 'Your plan'}</span> is active
      {' — '}
      {soonest.days_remaining} {soonest.days_remaining === 1 ? 'day' : 'days'} left, until{' '}
      {formatDate(soonest.end_date)}.
      {subscriptions.length > 1 && (
        <> You hold {subscriptions.length} plans; this is the one expiring first.</>
      )}
    </Banner>
  );
};
