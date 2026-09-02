import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import {
  getPaymentClaims,
  approvePaymentClaim,
  rejectPaymentClaim,
  getPaymentClaimScreenshot,
} from '@/api/adminService';
import {
  IndianRupee,
  Copy,
  Check,
  X,
  Image as ImageIcon,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

// ── Small shared bits (kept local, matching the other admin pages) ────────────

const Textarea = (props) => (
  <textarea
    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
    rows={3}
    {...props}
  />
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// DECIMAL columns arrive from Postgres as strings, so these are formatted from
// Number() rather than compared or rendered raw.
const money = (value, currency = 'INR') => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  return `${currency === 'INR' ? '₹' : ''}${n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// How long a buyer has been waiting. The promise on the confirmation page is
// two days, so anything past that is the thing to look at first.
const waitingFor = (submittedAt) => {
  if (!submittedAt) return null;
  const hours = (Date.now() - new Date(submittedAt).getTime()) / 3600000;
  if (hours < 1) return { label: 'just now', overdue: false };
  if (hours < 24) return { label: `${Math.floor(hours)}h`, overdue: false };
  const days = Math.floor(hours / 24);
  return { label: `${days}d`, overdue: days >= 2 };
};

const TABS = [
  { key: 'pending', label: 'Awaiting review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

// ── Screenshot ────────────────────────────────────────────────────────────────

/**
 * The screenshot is a private asset streamed by the backend, so it is fetched
 * with the auth header and rendered from an in-memory blob. The storage URL
 * never reaches the DOM.
 */
const ScreenshotViewer = ({ claimId }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let objectUrl = null;
    setState('loading');

    getPaymentClaimScreenshot(claimId)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
        setState('ready');
      })
      .catch(() => setState('error'));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [claimId]);

  if (state === 'loading') {
    return <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />;
  }

  if (state === 'error') {
    return (
      <div className="h-40 flex flex-col items-center justify-center text-center rounded-lg bg-slate-50 border border-slate-200">
        <ImageIcon className="w-6 h-6 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">Could not load the screenshot.</p>
        <p className="text-xs text-slate-400 mt-1">
          Check the bank statement against the UTR instead.
        </p>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt="Payment screenshot submitted by the buyer"
      className="w-full rounded-lg border border-slate-200"
    />
  );
};

// ── Copyable value ────────────────────────────────────────────────────────────

/**
 * The UTR exists to be pasted into a bank statement search, so it is one click
 * to copy rather than something to retype from a table cell.
 */
const CopyableCode = ({ value, title }) => {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-slate-400">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is blocked on insecure origins; the value is on screen anyway.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={title}
      className="group inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 hover:text-brand-blue transition"
    >
      {value}
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
      )}
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const AdminPaymentClaims = () => {
  const [status, setStatus] = useState('pending');
  const [includeUnsubmitted, setIncludeUnsubmitted] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewing, setReviewing] = useState(null); // claim open in the modal
  const [note, setNote] = useState('');
  const [action, setAction] = useState(null); // 'approve' | 'reject'
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentClaims(status, includeUnsubmitted);
      setClaims(res.data ?? []);
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load payment claims'));
    } finally {
      setLoading(false);
    }
  }, [status, includeUnsubmitted, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const openReview = (claim, which) => {
    setReviewing(claim);
    setAction(which);
    setNote('');
  };

  const submitReview = async () => {
    if (action === 'reject' && !note.trim()) {
      return notify('error', 'A reason is required — the buyer is told what it says');
    }

    setSaving(true);
    try {
      if (action === 'approve') {
        await approvePaymentClaim(reviewing.id, note.trim() || undefined);
        notify('success', `Approved — ${reviewing.user?.fullName ?? 'the buyer'} now has access`);
      } else {
        await rejectPaymentClaim(reviewing.id, note.trim());
        notify('success', 'Claim rejected');
      }
      setReviewing(null);
      setAction(null);
      load();
      // The sidebar badge is owned by AdminLayout and has no idea this happened.
      window.dispatchEvent(new Event('payment-claims-changed'));
    } catch (err) {
      notify('error', errorMessage(err, 'Could not record that decision'));
    } finally {
      setSaving(false);
    }
  };

  const overdueCount = claims.filter((c) => waitingFor(c.submitted_at)?.overdue).length;

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Buyers who say they have paid by QR. Check the UTR against the bank statement before
          approving — a screenshot is not proof. Approving is what grants the subscription.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              status === tab.key
                ? 'bg-brand-blue text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {status === 'pending' && (
          <label
            className="sm:ml-auto flex items-center gap-2 text-xs text-slate-500 cursor-pointer"
            title="Claims are created when a buyer opens the QR page. These are the ones who never came back to confirm they paid."
          >
            <input
              type="checkbox"
              checked={includeUnsubmitted}
              onChange={(e) => setIncludeUnsubmitted(e.target.checked)}
              className="rounded border-slate-300"
            />
            Include unconfirmed
          </label>
        )}
      </div>

      {status === 'pending' && overdueCount > 0 && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            {overdueCount} {overdueCount === 1 ? 'buyer has' : 'buyers have'} been waiting more than
            two days — past what the confirmation page promises them.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading claims…</div>
        ) : claims.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {status === 'pending' ? 'Nothing waiting for review.' : `No ${status} claims.`}
            </p>
            {status === 'pending' && (
              <p className="text-xs text-slate-400 mt-1">
                Claims appear here once a buyer confirms they have paid.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Buyer</th>
                  <th className="text-left font-medium px-5 py-3">Plan</th>
                  <th className="text-left font-medium px-5 py-3">Amount</th>
                  <th className="text-left font-medium px-5 py-3">UTR</th>
                  <th className="text-left font-medium px-5 py-3">Reference</th>
                  <th className="text-left font-medium px-5 py-3">Waiting</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const waited = waitingFor(claim.submitted_at);
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/60 align-top">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">
                          {claim.user?.fullName ?? `User #${claim.user_id}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{claim.user?.email}</p>
                      </td>

                      <td className="px-5 py-3 text-slate-600">{claim.course?.title ?? '—'}</td>

                      <td className="px-5 py-3">
                        <p className="text-slate-900 tabular-nums">
                          {money(claim.amount_claimed ?? claim.amount_expected, claim.currency)}
                        </p>
                        {/* A short payment is the common mistake, and easy to miss. */}
                        {!claim.amount_matches && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            expected {money(claim.amount_expected, claim.currency)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <CopyableCode value={claim.utr} title="Copy UTR to search your statement" />
                        {claim.duplicate_utr && (
                          <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            also on another claim
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <CopyableCode
                          value={claim.reference_code}
                          title="Copy the code the buyer was asked to put in the payment remarks"
                        />
                      </td>

                      <td className="px-5 py-3">
                        {claim.submitted_at ? (
                          <span
                            className={`text-xs ${
                              waited?.overdue ? 'text-amber-700 font-medium' : 'text-slate-500'
                            }`}
                            title={shortDate(claim.submitted_at)}
                          >
                            {waited?.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">not confirmed</span>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {claim.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            {claim.screenshot_url && (
                              <button
                                onClick={() => openReview(claim, null)}
                                className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-100 rounded-lg transition"
                                title="View screenshot"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openReview(claim, 'reject')}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReview(claim, 'approve')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              {claim.status} {shortDate(claim.reviewed_at)}
                            </p>
                            {claim.reviewer?.fullName && (
                              <p className="text-xs text-slate-400">by {claim.reviewer.fullName}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal — doubles as the screenshot viewer, so the evidence and the
          decision are on the same screen rather than two clicks apart. */}
      <Modal
        open={Boolean(reviewing)}
        onClose={() => {
          setReviewing(null);
          setAction(null);
        }}
        title={
          action === 'approve'
            ? 'Approve payment'
            : action === 'reject'
              ? 'Reject payment'
              : 'Payment screenshot'
        }
        footer={
          action && (
            <>
              <button
                onClick={() => {
                  setReviewing(null);
                  setAction(null);
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {saving
                  ? 'Saving…'
                  : action === 'approve'
                    ? 'Approve and grant access'
                    : 'Reject claim'}
              </button>
            </>
          )
        }
      >
        {reviewing && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Buyer</dt>
                <dd className="text-slate-900">{reviewing.user?.fullName}</dd>
                <dd className="text-xs text-slate-400">{reviewing.user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Plan</dt>
                <dd className="text-slate-900">{reviewing.course?.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Amount claimed</dt>
                <dd className="text-slate-900 tabular-nums">
                  {money(reviewing.amount_claimed ?? reviewing.amount_expected, reviewing.currency)}
                  {!reviewing.amount_matches && (
                    <span className="ml-2 text-xs text-amber-700">
                      expected {money(reviewing.amount_expected, reviewing.currency)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">UTR</dt>
                <dd>
                  <CopyableCode value={reviewing.utr} title="Copy UTR" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Reference code</dt>
                <dd>
                  <CopyableCode value={reviewing.reference_code} title="Copy reference" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Submitted</dt>
                <dd className="text-slate-900">{shortDate(reviewing.submitted_at)}</dd>
              </div>
            </dl>

            {reviewing.duplicate_utr && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">
                  This UTR appears on another claim too. One payment cannot buy two
                  subscriptions — check both before approving either.
                </p>
              </div>
            )}

            {action === 'approve' && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
                <IndianRupee className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">
                  Only approve once you have found this UTR in the bank statement. Approving
                  immediately grants{' '}
                  <span className="font-medium text-slate-900">{reviewing.course?.title}</span> and
                  starts the subscription clock.
                </p>
              </div>
            )}

            {reviewing.screenshot_url ? (
              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Screenshot supplied by the buyer — supporting context only, not proof.
                </p>
                <ScreenshotViewer claimId={reviewing.id} />
              </div>
            ) : (
              <p className="text-xs text-slate-400">No screenshot was attached.</p>
            )}

            {action && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  {action === 'reject' ? 'Reason (required)' : 'Note (optional)'}
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? 'No matching payment found in the statement'
                      : 'Paid ₹200 short, accepted'
                  }
                />
                <p className="text-xs text-slate-400">
                  {action === 'reject'
                    ? 'Kept on the claim and shown to the buyer.'
                    : 'Kept on the claim — the only record of why access was granted.'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};
