import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getAdminUsers,
  getAdminUser,
  banUser,
  unbanUser,
  removeUser,
  restoreUser,
  grantUserPlan,
  revokeSubscription,
  extendSubscription,
  changeSubscriptionPlan,
  getCourses,
} from '@/api/adminService';
import { Search, Users, Ban, ShieldCheck, Trash2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'banned', label: 'Banned' },
  { key: 'removed', label: 'Removed' },
];

const BAN_DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'custom', label: 'Custom…' },
  { value: 'permanent', label: 'Permanent' },
];

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const errorText = (err, fallback) => err?.response?.data?.message || fallback;

// ── Small shared bits (kept local, matching the other admin pages) ────────────

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent';

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm ${
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-50 text-green-700 border-green-200',
    banned: 'bg-red-50 text-red-700 border-red-200',
    removed: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
};

const PlanStatusBadge = ({ subscription }) => {
  if (subscription.is_live) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Active</span>;
  }
  if (subscription.status === 'revoked') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Revoked</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Expired</span>;
};

const ActionButton = ({ onClick, children, tone = 'default', disabled }) => {
  const tones = {
    default: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'border-red-200 text-red-700 hover:bg-red-50',
    primary: 'border-transparent bg-brand-blue text-white hover:bg-brand-blue-hover',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
};

// ── Dialogs ───────────────────────────────────────────────────────────────────

const BanDialog = ({ user, onClose, onDone }) => {
  const [duration, setDuration] = useState('7');
  const [customDays, setCustomDays] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const days = duration === 'permanent' ? undefined : duration === 'custom' ? Number(customDays) : Number(duration);
    if (duration === 'custom' && (!Number.isInteger(days) || days < 1)) {
      setError('Enter a whole number of days.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const { data } = await banUser(user.id, { days, reason: reason.trim() || undefined });
      onDone(data, `${user.fullName} has been banned`);
    } catch (err) {
      setError(errorText(err, 'Could not ban this user'));
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Ban ${user.fullName}`}
      size="sm"
      footer={(
        <>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="danger" onClick={submit} disabled={isSaving}>
            <Ban className="w-3.5 h-3.5" /> {isSaving ? 'Banning…' : 'Ban user'}
          </ActionButton>
        </>
      )}
    >
      <p className="text-sm text-slate-500 mb-4">
        They are signed out immediately and cannot sign in until the ban ends or you lift it.
      </p>
      <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {BAN_DURATIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDuration(option.value)}
            className={`px-2 py-2 rounded-lg border text-xs font-medium transition ${
              duration === option.value
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {duration === 'custom' && (
        <input
          type="number"
          min="1"
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          placeholder="Number of days"
          className={`${inputClass} mb-3`}
        />
      )}
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Reason <span className="font-normal text-slate-400">(shown to the user)</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="e.g. Sharing account with other people"
        className={inputClass}
      />
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
};

const ExtendDialog = ({ subscription, onClose, onDone }) => {
  const [mode, setMode] = useState('months');
  const [months, setMonths] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setIsSaving(true);
    setError('');
    try {
      const body = mode === 'months' ? { months: Number(months) } : { end_date: endDate };
      const { data } = await extendSubscription(subscription.id, body);
      onDone(data, `${subscription.plan_title} extended`);
    } catch (err) {
      setError(errorText(err, 'Could not extend this plan'));
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Extend ${subscription.plan_title}`}
      size="sm"
      footer={(
        <>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="primary" onClick={submit} disabled={isSaving || (mode === 'date' && !endDate)}>
            {isSaving ? 'Saving…' : 'Extend'}
          </ActionButton>
        </>
      )}
    >
      <p className="text-sm text-slate-500 mb-4">Currently ends {fmtDate(subscription.end_date)}.</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[['months', 'Add months'], ['date', 'Set end date']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${
              mode === key ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'months' ? (
        <select value={months} onChange={(e) => setMonths(e.target.value)} className={inputClass}>
          {[1, 2, 3, 6, 12].map((m) => (
            <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
          ))}
        </select>
      ) : (
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
      )}
      {mode === 'months' && !subscription.is_live && (
        <p className="mt-2 text-xs text-slate-500">This plan has expired, so the months are added from today.</p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
};

const PlanPickerDialog = ({ title, description, confirmLabel, courses, excludeCourseId, onClose, onSubmit }) => {
  const options = courses.filter((c) => c.id !== excludeCourseId);
  const [courseId, setCourseId] = useState(options[0]?.id ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onSubmit(Number(courseId));
    } catch (err) {
      setError(errorText(err, 'Could not save'));
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="primary" onClick={submit} disabled={isSaving || !courseId}>
            {isSaving ? 'Saving…' : confirmLabel}
          </ActionButton>
        </>
      )}
    >
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
        {options.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}{course.is_active === false ? ' (retired)' : ''}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
};

const RevokeDialog = ({ subscription, onClose, onDone }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isPaid = subscription.source === 'payment_claim';

  const submit = async () => {
    setIsSaving(true);
    setError('');
    try {
      const { data } = await revokeSubscription(subscription.id, note.trim() || undefined);
      onDone(data, `${subscription.plan_title} revoked`);
    } catch (err) {
      setError(errorText(err, 'Could not revoke this plan'));
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Revoke ${subscription.plan_title}`}
      size="sm"
      footer={(
        <>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="danger" onClick={submit} disabled={isSaving}>
            {isSaving ? 'Revoking…' : 'Revoke access'}
          </ActionButton>
        </>
      )}
    >
      <p className="text-sm text-slate-500 mb-4">
        Access ends immediately.
        {isPaid && ' This plan was paid for — the payment record is kept, with your note added to it.'}
      </p>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Note <span className="font-normal text-slate-400">(optional, for the admin team)</span>
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="e.g. Payment reversed by bank"
        className={inputClass}
      />
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
};

// ── User detail ───────────────────────────────────────────────────────────────

const UserDetail = ({ userId, courses, onClose, onChanged, showToast }) => {
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [dialog, setDialog] = useState(null); // { type, subscription? }

  useEffect(() => {
    getAdminUser(userId)
      .then(({ data }) => setUser(data))
      .catch((err) => setLoadError(errorText(err, 'Could not load this user')));
  }, [userId]);

  const applyUpdate = (updated, message) => {
    setUser(updated);
    setDialog(null);
    onChanged();
    showToast('success', message);
  };

  const runQuickAction = async (action, message) => {
    try {
      const { data } = await action();
      applyUpdate(data, message);
    } catch (err) {
      showToast('error', errorText(err, 'That did not work'));
    }
  };

  const isAdminAccount = user?.role === 'admin';

  return (
    <Modal open onClose={onClose} title={user ? user.fullName : 'User'} size="lg">
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {!user && !loadError && <p className="text-sm text-slate-400">Loading…</p>}

      {user && (
        <div className="space-y-6">
          {/* ── Account ── */}
          <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-700">{user.email}</p>
                <StatusBadge status={user.account_status} />
                {isAdminAccount && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">Admin</span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1">
                WhatsApp:{' '}
                {user.phone ? (
                  <a
                    href={`https://wa.me/${user.phone.replace('+', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {user.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">not given</span>
                )}
              </p>
              <p className="text-sm text-slate-700 mt-1">
                AMC exam:{' '}
                {user.amcExamDate ? (
                  <span className="font-medium">{fmtDate(`${user.amcExamDate}T00:00:00`)}</span>
                ) : (
                  <span className="text-slate-400">not set</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Joined {fmtDate(user.createdAt)}
                {user.country ? ` · ${user.country}` : ''}
                {user.professionalRole ? ` · ${user.professionalRole}` : ''}
              </p>
              {user.account_status === 'banned' && (
                <p className="mt-2 text-xs text-red-700">
                  Banned {user.banned_until ? `until ${fmtDate(user.banned_until)}` : 'permanently'}
                  {user.ban_reason ? ` — ${user.ban_reason}` : ''}
                </p>
              )}
              {user.account_status === 'removed' && (
                <p className="mt-2 text-xs text-slate-500">Removed {fmtDate(user.deleted_at)}</p>
              )}
            </div>

            {!isAdminAccount && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {user.account_status === 'banned' ? (
                  <ActionButton onClick={() => setDialog({ type: 'unban' })}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Unban
                  </ActionButton>
                ) : user.account_status === 'active' && (
                  <ActionButton tone="danger" onClick={() => setDialog({ type: 'ban' })}>
                    <Ban className="w-3.5 h-3.5" /> Ban
                  </ActionButton>
                )}
                {user.account_status === 'removed' ? (
                  <ActionButton onClick={() => setDialog({ type: 'restore' })}>
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </ActionButton>
                ) : (
                  <ActionButton tone="danger" onClick={() => setDialog({ type: 'remove' })}>
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </ActionButton>
                )}
              </div>
            )}
          </section>

          {/* ── Plans ── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Plans</h3>
              <ActionButton tone="primary" onClick={() => setDialog({ type: 'grant' })}>Grant plan</ActionButton>
            </div>
            {user.subscriptions.length === 0 ? (
              <p className="text-sm text-slate-400">No plans yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {user.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{subscription.plan_title ?? 'Untitled plan'}</p>
                        <PlanStatusBadge subscription={subscription} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(subscription.start_date)} → {fmtDate(subscription.end_date)}
                        {' · '}
                        {subscription.source === 'payment_claim' ? 'Paid' : subscription.source === 'manual' ? 'Granted by admin' : 'Legacy'}
                      </p>
                    </div>
                    {subscription.status !== 'revoked' && (
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => setDialog({ type: 'extend', subscription })}>Extend</ActionButton>
                        {subscription.is_live && (
                          <>
                            <ActionButton onClick={() => setDialog({ type: 'change', subscription })}>Change plan</ActionButton>
                            <ActionButton tone="danger" onClick={() => setDialog({ type: 'revoke', subscription })}>Revoke</ActionButton>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Payments ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Payments</h3>
            {user.payment_claims.length === 0 ? (
              <p className="text-sm text-slate-400">No submitted payments.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {user.payment_claims.map((claim) => (
                  <div key={claim.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {claim.course?.title ?? 'Plan'}
                          <span className="font-normal text-slate-600">
                            {' · ₹'}{Number(claim.amount_claimed ?? claim.amount_expected).toLocaleString('en-IN')}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          UTR <span className="font-mono">{claim.utr ?? '—'}</span>
                          {' · '}{fmtDate(claim.submitted_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        claim.status === 'approved' ? 'bg-green-50 text-green-700'
                          : claim.status === 'rejected' ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    {claim.admin_note && (
                      <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{claim.admin_note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {dialog?.type === 'ban' && <BanDialog user={user} onClose={() => setDialog(null)} onDone={applyUpdate} />}
      {dialog?.type === 'extend' && (
        <ExtendDialog subscription={dialog.subscription} onClose={() => setDialog(null)} onDone={applyUpdate} />
      )}
      {dialog?.type === 'revoke' && (
        <RevokeDialog subscription={dialog.subscription} onClose={() => setDialog(null)} onDone={applyUpdate} />
      )}
      {dialog?.type === 'grant' && (
        <PlanPickerDialog
          title="Grant a plan"
          description="Gives access straight away for the plan's full length, without a payment."
          confirmLabel="Grant plan"
          courses={courses}
          onClose={() => setDialog(null)}
          onSubmit={async (courseId) => {
            const { data } = await grantUserPlan(user.id, courseId);
            applyUpdate(data, 'Plan granted');
          }}
        />
      )}
      {dialog?.type === 'change' && (
        <PlanPickerDialog
          title={`Change ${dialog.subscription.plan_title}`}
          description={`The current plan is revoked and the new one runs until the same end date (${fmtDate(dialog.subscription.end_date)}). Extend it afterwards if they paid for more time.`}
          confirmLabel="Change plan"
          courses={courses}
          excludeCourseId={dialog.subscription.course_id}
          onClose={() => setDialog(null)}
          onSubmit={async (courseId) => {
            const { data } = await changeSubscriptionPlan(dialog.subscription.id, courseId);
            applyUpdate(data, 'Plan changed');
          }}
        />
      )}
      <ConfirmDialog
        open={dialog?.type === 'unban'}
        onClose={() => setDialog(null)}
        onConfirm={() => runQuickAction(() => unbanUser(user.id), `${user.fullName} has been unbanned`)}
        title="Lift this ban?"
        message="They can sign in again straight away."
        confirmLabel="Unban"
        confirmClass="bg-brand-blue hover:bg-brand-blue-hover text-white"
      />
      <ConfirmDialog
        open={dialog?.type === 'remove'}
        onClose={() => setDialog(null)}
        onConfirm={() => runQuickAction(() => removeUser(user.id), `${user.fullName} has been removed`)}
        title={`Remove ${user?.fullName}?`}
        message="They are signed out and can no longer sign in. Their payments, plans and results are kept, and you can restore the account later from the Removed tab."
        confirmLabel="Remove user"
      />
      <ConfirmDialog
        open={dialog?.type === 'restore'}
        onClose={() => setDialog(null)}
        onConfirm={() => runQuickAction(() => restoreUser(user.id), `${user.fullName} has been restored`)}
        title="Restore this account?"
        message="They can sign in again, with their plans and history as they were."
        confirmLabel="Restore"
        confirmClass="bg-brand-blue hover:bg-brand-blue-hover text-white"
      />
    </Modal>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const AdminUsers = () => {
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await getAdminUsers({ status, search: search || undefined, page, page_size: PAGE_SIZE });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setLoadError(errorText(err, 'Could not load users'));
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    getCourses()
      .then(({ data }) => setCourses(data))
      .catch(() => showToast('error', 'Could not load plans — granting and changing plans is unavailable'));
  }, []);

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every account, its plans and payments. Ban or remove an account, and grant, extend, change or
          revoke plans. Changes take effect immediately.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                status === tab.key
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search users"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Loading…</p>
        ) : loadError ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">{loadError}</p>
        ) : users.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No users match.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">User</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Current plan</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">
                        {user.fullName}
                        {user.role === 'admin' && <span className="ml-2 text-xs font-medium text-violet-600">Admin</span>}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={user.account_status} /></td>
                    <td className="px-5 py-3">
                      {user.active_plans.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : user.active_plans.map((plan) => (
                        <p key={plan.id} className="text-slate-700">
                          {plan.plan_title} <span className="text-xs text-slate-400">until {fmtDate(plan.end_date)}</span>
                        </p>
                      ))}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>{pagination.total} users · page {pagination.page} of {pagination.total_pages}</span>
            <div className="flex gap-2">
              <ActionButton onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </ActionButton>
              <ActionButton onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.total_pages}>
                Next <ChevronRight className="w-3.5 h-3.5" />
              </ActionButton>
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetail
          userId={selectedUserId}
          courses={courses}
          onClose={() => setSelectedUserId(null)}
          onChanged={loadUsers}
          showToast={showToast}
        />
      )}
    </AdminLayout>
  );
};
