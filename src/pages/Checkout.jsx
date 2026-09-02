import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getCourseById } from '@/api/courseService';
import { startPaymentClaim, submitPaymentClaim } from '@/api/userService';
import { UPI_ID, UPI_PAYEE, UPI_CONFIGURED, upiPaymentUri } from '@/config/payment';

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const money = (value) =>
  value === null || value === undefined
    ? '—'
    : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** One tap to copy, because these get retyped into a banking app otherwise. */
const Copyable = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Blocked on insecure origins. The value is on screen regardless.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-violet-300"
    >
      <span>
        <span className="block text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block font-mono text-sm font-semibold text-slate-900">{value}</span>
      </span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-violet-600" />
      )}
    </button>
  );
};

export const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [utr, setUtr] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // The claim is opened here, before payment, so the reference code can be
        // shown on the QR. Repeat visits reuse the same claim rather than
        // opening a second one.
        const [courseRes, claimRes] = await Promise.all([
          getCourseById(courseId),
          startPaymentClaim(courseId),
        ]);
        if (cancelled) return;
        setCourse(courseRes.data);
        setClaim(claimRes.data);
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, 'Could not start checkout'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!utr.trim()) {
      setFormError('Enter the UPI reference number (UTR) from your payment app.');
      return;
    }

    setSubmitting(true);
    try {
      await submitPaymentClaim(claim.id, {
        utr: utr.trim(),
        amount_claimed: amountPaid,
        screenshot,
      });
      navigate('/payment-submitted', { replace: true });
    } catch (err) {
      setFormError(errorMessage(err, 'Could not submit your payment details'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="pricing">
        <div className="flex items-center justify-center py-32 text-sm text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing your payment…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout active="pricing">
        <div className="flex flex-col items-center px-6 py-28 text-center">
          <AlertTriangle className="mb-4 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-600">{loadError}</p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const price = claim.amount_expected;
  const uri = upiPaymentUri({ amount: price, reference: claim.reference_code });

  return (
    <DashboardLayout active="pricing">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/pricing"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Plans
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Pay for {course?.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Six months of access. Payments are checked by hand against our bank statement, so
          access opens within two working days of your transfer.
        </p>

        {!UPI_CONFIGURED && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Test mode.</span> These payment details are
              placeholders and no money will reach anyone. Set VITE_UPI_ID and VITE_UPI_PAYEE
              before taking real payments.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* ── Pay ─────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Amount due</p>
            <p className="text-3xl font-bold text-slate-900">{money(price)}</p>

            <div className="mt-5 flex justify-center rounded-xl border border-slate-100 bg-slate-50 p-5">
              {/* The QR encodes payee, exact amount and reference together, so
                  the buyer confirms rather than types — which is what stops the
                  short payments and unmatched transfers. */}
              <QRCodeCanvas value={uri} size={180} level="M" includeMargin={false} />
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Scan with any UPI app. The amount and reference fill in automatically.
            </p>

            <div className="mt-5 space-y-2">
              <Copyable value={UPI_ID} label={`UPI ID — ${UPI_PAYEE}`} />
              <Copyable value={claim.reference_code} label="Your reference (add to remarks)" />
            </div>
          </div>

          {/* ── Confirm ─────────────────────────────────────────────────────── */}
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold text-slate-900">After you have paid</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Tell us the reference number your payment app shows. It is how we find your
              transfer in our statement — without it we cannot match your payment to your
              account.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  UPI reference / UTR <span className="text-red-500">*</span>
                </label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 523100447781"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-slate-400">
                  A 12-digit number, shown as UTR, UPI Ref or Transaction ID.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Amount you sent
                </label>
                <input
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  inputMode="decimal"
                  placeholder={String(Number(price))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Screenshot <span className="text-slate-400">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 transition hover:border-violet-400 hover:text-violet-600"
                >
                  <Upload className="h-4 w-4" />
                  {screenshot ? screenshot.name : 'Attach payment screenshot'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'I have paid'
              )}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              We never ask for your UPI PIN, card number or one-time password.
            </p>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
