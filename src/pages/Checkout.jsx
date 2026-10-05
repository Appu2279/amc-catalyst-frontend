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
  ArrowRight,
  QrCode,
  Landmark,
  Smartphone,
  X,
  Clock,
  ImageIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getCourseById } from '@/api/courseService';
import { startPaymentClaim, submitPaymentClaim } from '@/api/userService';
import { formatAud, formatAudAmount } from '@/lib/currency';
import {
  UPI_ID,
  UPI_PAYEE,
  UPI_CONFIGURED,
  BANK_DETAILS,
  upiPaymentUri,
} from '@/config/payment';

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const money = (value) =>
  value === null || value === undefined
    ? '—'
    : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;


const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm', icon: QrCode },
  { id: 'bank', label: 'Bank transfer', hint: 'NEFT / IMPS', icon: Landmark },
];

const PROGRESS_STEPS = ['Choose plan', 'Pay', 'Confirm', 'Access'];
// The buyer has already picked a plan to get here, so "Pay" is where they are.
const CURRENT_PROGRESS_STEP = 1;

const useCopy = (value) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // Blocked on insecure origins. The value is on screen regardless.
    }
  };

  return [isCopied, copy];
};

const CopyIcon = ({ isCopied }) =>
  isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />;

/** A label/value row with a copy button — these get retyped into a banking app otherwise. */
const CopyRow = ({ label, value }) => {
  const [isCopied, copy] = useCopy(value);

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-all font-mono text-sm font-semibold text-slate-900">{value}</dd>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-brand-violet/10 hover:text-brand-violet focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
      >
        <CopyIcon isCopied={isCopied} />
      </button>
    </div>
  );
};

const ProgressTracker = () => (
  <ol className="flex items-center gap-2" aria-label="Checkout progress">
    {PROGRESS_STEPS.map((step, index) => {
      const isDone = index < CURRENT_PROGRESS_STEP;
      const isCurrent = index === CURRENT_PROGRESS_STEP;
      return (
        <li key={step} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            aria-current={isCurrent ? 'step' : undefined}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isDone
                ? 'bg-brand-violet text-white'
                : isCurrent
                  ? 'bg-brand-violet text-white ring-4 ring-brand-violet/20'
                  : 'bg-slate-200 text-slate-500'
            }`}
          >
            {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
          </span>
          <span
            className={`hidden whitespace-nowrap text-sm sm:inline ${
              isCurrent ? 'font-semibold text-slate-900' : 'text-slate-500'
            }`}
          >
            {step}
          </span>
          {index < PROGRESS_STEPS.length - 1 && (
            <span
              className={`h-0.5 flex-1 rounded-full ${isDone ? 'bg-brand-violet' : 'bg-slate-200'}`}
            />
          )}
        </li>
      );
    })}
  </ol>
);

const SectionHeading = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/12 to-indigo-500/12 text-sm font-black text-brand-violet">
      {number}
    </span>
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  </div>
);

const OrderSummary = ({ course, audPrice, price, referenceCode }) => {
  const [isCopied, copy] = useCopy(referenceCode);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-violet/30 blur-3xl" />

      <div className="relative p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
          Order summary
        </p>
        <p className="mt-3 text-xl font-bold">{course?.title}</p>
        <p className="text-sm text-slate-400">6 months of full access</p>

        <div className="mt-6">
          {audPrice != null ? (
            <>
              <p className="text-4xl font-black tracking-tight">
                {formatAudAmount(audPrice)}
                <span className="ml-1.5 text-lg font-bold tracking-normal text-indigo-300">AUD</span>
              </p>
              <p className="mt-1 text-sm text-slate-300">
                You pay <span className="font-semibold text-white">{money(price)}</span>
              </p>
            </>
          ) : (
            <p className="text-4xl font-black tracking-tight">{money(price)}</p>
          )}
        </div>
      </div>

      <div className="relative mx-6 border-t-2 border-dashed border-white/15" />

      <div className="relative p-6">
        <p className="text-xs text-slate-400">Your payment reference</p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy payment reference ${referenceCode}`}
          className="mt-2 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <span className="font-mono text-xl font-bold tracking-[0.2em]">{referenceCode}</span>
          <span
            aria-live="polite"
            className={`flex items-center gap-1 text-xs font-semibold ${
              isCopied ? 'text-green-400' : 'text-indigo-300'
            }`}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? 'Copied' : 'Copy'}
          </span>
        </button>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Add this to your payment remarks so we can match the payment to your account.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            Access opens within two working days
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            We never ask for your UPI PIN, card number or OTP
          </li>
        </ul>
      </div>
    </div>
  );
};

const UpiPanel = ({ uri }) => {
  const [isCopied, copy] = useCopy(UPI_ID);

  return (
    <div id="panel-upi" role="tabpanel" aria-labelledby="tab-upi" className="mt-6">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto rounded-3xl bg-gradient-to-br from-brand-violet to-indigo-600 p-1 shadow-lg shadow-brand-violet/20">
          <div className="rounded-[1.25rem] bg-white p-4">
            {/* The QR encodes payee, exact amount and reference together, so
                the buyer confirms rather than types — which is what stops the
                short payments and unmatched transfers. */}
            <QRCodeCanvas value={uri} size={176} level="M" includeMargin={false} />
          </div>
        </div>

        <ol className="space-y-4">
          {[
            'Open any UPI app on your phone',
            'Scan this code — the amount and reference fill in for you',
            'Approve, then note the UTR / transaction ID',
          ].map((text, index) => (
            <li key={text} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {index + 1}
              </span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* On a phone the QR is on the same screen as the camera, so offer to
          open the UPI app directly instead. */}
      <a
        href={uri}
        className="mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-brand-violet text-sm font-bold text-white transition hover:bg-brand-violet-hover md:hidden"
      >
        <Smartphone className="h-4 w-4" />
        Pay with UPI app
      </a>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">Or pay to UPI ID · {UPI_PAYEE}</p>
          <p className="break-all font-mono text-sm font-semibold text-slate-900">{UPI_ID}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy UPI ID"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-brand-violet/10 hover:text-brand-violet focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
        >
          <CopyIcon isCopied={isCopied} />
        </button>
      </div>
    </div>
  );
};

const BankPanel = ({ priceLabel, referenceCode }) => (
  <div id="panel-bank" role="tabpanel" aria-labelledby="tab-bank" className="mt-6">
    <div className="rounded-2xl border border-slate-200 px-4">
      <dl className="divide-y divide-slate-100">
        <CopyRow label="Account name" value={BANK_DETAILS.accountName} />
        <CopyRow label="Account number" value={BANK_DETAILS.accountNumber} />
        <CopyRow label="IFSC" value={BANK_DETAILS.ifsc} />
        <CopyRow label="Mobile number" value={BANK_DETAILS.mobile} />
      </dl>
    </div>
    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>
        Send exactly <span className="font-semibold">{priceLabel}</span> and write{' '}
        <span className="font-mono font-semibold">{referenceCode}</span> in the remarks.
      </span>
    </p>
  </div>
);

export const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [method, setMethod] = useState('upi');
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fileRef = useRef(null);
  const utrRef = useRef(null);

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
        // Prefilled because most buyers send exactly the amount due; they only
        // need to touch it when they didn't.
        setAmountPaid(String(Number(claimRes.data.amount_expected)));
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

  const clearScreenshot = () => {
    setScreenshot(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!utr.trim()) {
      setUtrError('Enter the transaction reference (UTR) from your payment app or bank.');
      utrRef.current?.focus();
      return;
    }
    setUtrError(null);

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
        <div className="flex items-center justify-center py-32 text-sm text-slate-500">
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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-violet-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // amount_expected is always INR — the backend converts the AUD price at the
  // current rate when the claim opens — so it stays the amount to transfer.
  // The AUD price is shown alongside so it matches the pricing card.
  const price = claim.amount_expected;
  const pricing = course?.CoursePricings?.[0];
  const audPrice = pricing?.discounted_price_aud ?? pricing?.actual_price_aud;
  const uri = upiPaymentUri({ amount: price, reference: claim.reference_code });
  const priceLabel = audPrice != null ? `${formatAud(audPrice)} (${money(price)})` : money(price);

  return (
    <DashboardLayout active="pricing">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-100/60 via-indigo-50/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/pricing"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-violet"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plans
          </Link>

          <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Checkout
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Send the payment, then share its reference — that's it.
              </p>
            </div>
            <div className="lg:w-[420px]">
              <ProgressTracker />
            </div>
          </div>

          {!UPI_CONFIGURED && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Test mode.</span> These payment details are
                placeholders and no money will reach anyone. Set VITE_UPI_ID and VITE_UPI_PAYEE
                before taking real payments.
              </p>
            </div>
          )}

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
            {/* Order summary — first on mobile, sticky sidebar on desktop. */}
            <aside className="lg:sticky lg:top-6 lg:order-2">
              <OrderSummary
                course={course}
                audPrice={audPrice}
                price={price}
                referenceCode={claim.reference_code}
              />
            </aside>

            <div className="space-y-6 lg:order-1">
              {/* ── Step 1: Pay ─────────────────────────────────────────── */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <SectionHeading
                  number={1}
                  title={`Send ${priceLabel}`}
                  description="Pick whichever is easier for you."
                />

                <div role="tablist" aria-label="Payment method" className="mt-6 grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(({ id, label, hint, icon: Icon }) => {
                    const isSelected = method === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`tab-${id}`}
                        aria-selected={isSelected}
                        aria-controls={`panel-${id}`}
                        onClick={() => setMethod(id)}
                        className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-brand-violet bg-brand-violet/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-brand-violet text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900">{label}</span>
                          <span className="block truncate text-xs text-slate-500">{hint}</span>
                        </span>
                        {isSelected && (
                          <Check className="absolute right-3 top-3 h-4 w-4 text-brand-violet" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {method === 'upi' ? (
                  <UpiPanel uri={uri} />
                ) : (
                  <BankPanel priceLabel={priceLabel} referenceCode={claim.reference_code} />
                )}
              </section>

              {/* ── Step 2: Confirm ─────────────────────────────────────── */}
              <form
                onSubmit={submit}
                noValidate
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
              >
                <SectionHeading
                  number={2}
                  title="Confirm your payment"
                  description="The reference number is how we find your transfer in our statement."
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="utr" className="block text-sm font-semibold text-slate-800">
                      Transaction reference (UTR) <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="utr"
                      ref={utrRef}
                      value={utr}
                      onChange={(e) => {
                        setUtr(e.target.value);
                        if (utrError) setUtrError(null);
                      }}
                      placeholder="e.g. 523100447781"
                      autoComplete="off"
                      aria-invalid={Boolean(utrError)}
                      aria-describedby={utrError ? 'utr-error' : 'utr-help'}
                      className={`w-full rounded-xl border bg-slate-50 px-4 py-3 font-mono text-base transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-violet ${
                        utrError ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {utrError ? (
                      <p id="utr-error" role="alert" className="text-sm text-red-600">
                        {utrError}
                      </p>
                    ) : (
                      <p id="utr-help" className="text-xs text-slate-500">
                        Usually 12 digits, shown as UTR, UPI Ref or Transaction ID.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="amount-paid" className="block text-sm font-semibold text-slate-800">
                      Amount sent
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        ₹
                      </span>
                      <input
                        id="amount-paid"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        inputMode="decimal"
                        aria-describedby="amount-help"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 text-base transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-violet"
                      />
                    </div>
                    <p id="amount-help" className="text-xs text-slate-500">
                      Change only if you sent a different amount.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-sm font-semibold text-slate-800">
                      Screenshot <span className="font-normal text-slate-500">(optional)</span>
                    </span>
                    {screenshot ? (
                      <div className="flex min-h-[50px] items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-green-800">
                          <ImageIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{screenshot.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={clearScreenshot}
                          aria-label="Remove screenshot"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-green-700 transition hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 transition hover:border-brand-violet hover:bg-brand-violet/5 hover:text-brand-violet focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
                      >
                        <Upload className="h-4 w-4" />
                        Upload image
                      </button>
                    )}
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
                  <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-violet text-sm font-bold text-white shadow-lg shadow-brand-violet/25 transition hover:bg-brand-violet-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit payment details
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
