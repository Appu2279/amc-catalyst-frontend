import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import {
  getReferralOverview,
  updateReferralConfig,
  getReferrals,
  getReferralCodes,
  createPartnerReferralCode,
  updateReferralCode,
  getReferralRewards,
  markReferralRewardPaid,
} from '@/api/adminService';
import {
  Gift, Users, CheckCircle2, BadgeCheck, Wallet, Coins, Plus,
  Power, Inbox, Copy, Check,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const money = (value, currency = 'INR') => {
  const n = Number(value ?? 0);
  return `${currency === 'INR' ? '₹' : `${currency} `}${n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const MODE_LABELS = {
  both: 'Both sides rewarded',
  referrer_only: 'Referrer only',
  off: 'Off — no rewards',
};

const STATUS_PILL = {
  joined: 'bg-slate-100 text-slate-600',
  qualified: 'bg-blue-100 text-blue-700',
  rewarded: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const Pill = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_PILL[value] ?? 'bg-slate-100 text-slate-600'}`}>
    {value}
  </span>
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

const CopyCode = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* insecure origin */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 hover:text-brand-blue transition"
    >
      {value}
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-600" />
        : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />}
    </button>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-lg font-bold text-slate-900 truncate">{value ?? '—'}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
);

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'codes', label: 'Partner codes' },
  { key: 'rewards', label: 'Rewards' },
];

// ── Overview tab ──────────────────────────────────────────────────────────────

const OverviewTab = ({ notify }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('both');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReferralOverview();
      setData(res.data);
      setMode(res.data.config.mode);
      setAmount(String(res.data.config.reward_amount));
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load the referral overview'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await updateReferralConfig({ mode, reward_amount: Number(amount) });
      notify('success', 'Referral settings saved');
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading…</div>;
  if (!data) return null;

  const c = data.config;
  const dirty = mode !== c.mode || Number(amount) !== Number(c.reward_amount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total referrals" value={data.referrals.total} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Signed up (not yet paid)" value={data.referrals.joined} icon={Gift} color="bg-slate-100 text-slate-600" />
        <StatCard label="Qualified" value={data.referrals.qualified + data.referrals.rewarded} icon={CheckCircle2} color="bg-green-50 text-green-600" />
        <StatCard label="Active partner codes" value={data.active_partner_codes} icon={BadgeCheck} color="bg-violet-50 text-violet-600" />
        <StatCard
          label="Owed (unpaid)"
          value={`${money(data.rewards.pending_amount, data.rewards.currency)} · ${data.rewards.pending_count}`}
          icon={Wallet}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Paid out"
          value={`${money(data.rewards.paid_amount, data.rewards.currency)} · ${data.rewards.paid_count}`}
          icon={Coins}
          color="bg-green-50 text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
        <h2 className="text-sm font-semibold text-slate-800">Programme settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Changing the amount only affects referrals that qualify after the change — rewards already
          earned keep the amount they were earned at.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {Object.entries(MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'both' && 'The referrer and the person they referred each earn the reward amount.'}
              {mode === 'referrer_only' && 'Only the referrer earns; the new user gets nothing.'}
              {mode === 'off' && 'No rewards accrue. Codes still work and sign-ups are still recorded.'}
            </p>
          </div>

          <div className={mode === 'off' ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Reward amount ({c.currency})
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || !dirty}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Referrals tab ─────────────────────────────────────────────────────────────

const ReferralsTab = ({ notify }) => {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReferrals(status ? { status } : {});
      setRows(res.data?.data ?? []);
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load referrals'));
    } finally {
      setLoading(false);
    }
  }, [status, notify]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['', 'joined', 'qualified', 'rewarded'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
              status === s ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No referrals yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Referred by</th>
                  <th className="text-left font-medium px-5 py-3">New user</th>
                  <th className="text-left font-medium px-5 py-3">Code</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Rewards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                    <td className="px-5 py-3">
                      {r.referrer?.type === 'partner' ? (
                        <>
                          <p className="font-medium text-slate-900">{r.referrer.name}</p>
                          <p className="text-xs text-violet-600 font-medium">Partner</p>
                        </>
                      ) : r.referrer ? (
                        <>
                          <p className="font-medium text-slate-900">{r.referrer.name ?? `User #${r.referrer.user_id}`}</p>
                          <p className="text-xs text-slate-400">{r.referrer.email}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{r.referred_user?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{r.referred_user?.email}</p>
                    </td>
                    <td className="px-5 py-3"><CopyCode value={r.code} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{shortDate(r.joined_at)}</td>
                    <td className="px-5 py-3"><Pill value={r.status} /></td>
                    <td className="px-5 py-3">
                      {r.rewards.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          {r.status === 'joined' ? 'not qualified' : 'none'}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {r.rewards.map((rw) => (
                            <p key={rw.id} className="text-xs text-slate-600">
                              <span className="capitalize">{rw.kind}</span>: {money(rw.amount, rw.currency)}{' '}
                              <span className={rw.status === 'paid' ? 'text-green-600' : 'text-amber-600'}>
                                ({rw.status})
                              </span>
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Partner codes tab ─────────────────────────────────────────────────────────

const CodesTab = ({ notify }) => {
  const [type, setType] = useState('partner');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', partner_name: '', partner_note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReferralCodes(type);
      setRows(res.data ?? []);
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load codes'));
    } finally {
      setLoading(false);
    }
  }, [type, notify]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      await createPartnerReferralCode({
        code: form.code,
        partner_name: form.partner_name,
        partner_note: form.partner_note,
      });
      notify('success', 'Partner code created');
      setCreating(false);
      setForm({ code: '', partner_name: '', partner_note: '' });
      setType('partner');
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not create the code'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateReferralCode(row.id, { is_active: !row.is_active });
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not update the code'));
    }
  };

  const linkFor = (code) => `${window.location.origin}/?ref=${encodeURIComponent(code)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[['partner', 'Partner codes'], ['user', 'User codes'], ['', 'All']].map(([v, label]) => (
          <button
            key={v || 'all'}
            onClick={() => setType(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              type === v ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setCreating(true)}
          className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition"
        >
          <Plus className="w-4 h-4" /> New partner code
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No codes here yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Code</th>
                  <th className="text-left font-medium px-5 py-3">Owner</th>
                  <th className="text-left font-medium px-5 py-3">Referrals</th>
                  <th className="text-left font-medium px-5 py-3">Link</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-50/60 align-top ${!row.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <CopyCode value={row.code} />
                      {!row.is_active && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
                    </td>
                    <td className="px-5 py-3">
                      {row.owner_type === 'partner' ? (
                        <>
                          <p className="font-medium text-slate-900">{row.partner_name}</p>
                          {row.partner_note && (
                            <p className="text-xs text-slate-400 whitespace-pre-wrap">{row.partner_note}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-slate-900">{row.owner?.name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{row.owner?.email}</p>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {row.referrals}
                      {row.qualified_referrals > 0 && (
                        <span className="text-green-600"> · {row.qualified_referrals} qualified</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><CopyCode value={linkFor(row.code)} /></td>
                    <td className="px-5 py-3 text-right">
                      {row.owner_type === 'partner' && (
                        <button
                          onClick={() => toggleActive(row)}
                          title={row.is_active ? 'Deactivate' : 'Reactivate'}
                          className={`p-2 rounded-lg transition ${
                            row.is_active
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New partner code"
        footer={
          <>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={saving || !form.code.trim() || !form.partner_name.trim()}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition disabled:opacity-40"
            >
              {saving ? 'Creating…' : 'Create code'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="WINGX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <p className="text-xs text-slate-400 mt-1">
              3–24 characters, letters/numbers/dashes. This is what the partner asked for and what
              goes in their link.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Partner name</label>
            <input
              value={form.partner_name}
              onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))}
              placeholder="Wing X (via Bala)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (optional)</label>
            <textarea
              rows={3}
              value={form.partner_note}
              onChange={(e) => setForm((f) => ({ ...f, partner_note: e.target.value }))}
              placeholder="Payout: UPI 98xxxxxx@bank — agreed rate as per programme"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── Rewards tab ───────────────────────────────────────────────────────────────

const RewardsTab = ({ notify }) => {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReferralRewards(status ? { status } : {});
      setRows(res.data?.data ?? []);
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load rewards'));
    } finally {
      setLoading(false);
    }
  }, [status, notify]);

  useEffect(() => { load(); }, [load]);

  const confirmPay = async () => {
    setSaving(true);
    try {
      await markReferralRewardPaid(paying.id, note.trim() || undefined);
      notify('success', 'Marked as paid');
      setPaying(null);
      setNote('');
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not update the reward'));
    } finally {
      setSaving(false);
    }
  };

  const payeeLabel = (p) => {
    if (!p) return '—';
    if (p.type === 'partner') return p.name;
    if (p.type === 'user') return p.name ?? p.email;
    return 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['pending', 'paid', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
              status === s ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No {status || ''} rewards.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Pay to</th>
                  <th className="text-left font-medium px-5 py-3">For</th>
                  <th className="text-left font-medium px-5 py-3">Amount</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{payeeLabel(r.payee)}</p>
                      <p className="text-xs text-slate-400">
                        {r.payee?.type === 'partner' ? 'Partner' : r.payee?.email}
                        {r.payee?.note ? ` · ${r.payee.note}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-600 capitalize">{r.kind} reward</p>
                      <p className="text-xs text-slate-400">
                        {r.referred_user?.name ?? '—'} · code {r.code}
                      </p>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-900">{money(r.amount, r.currency)}</td>
                    <td className="px-5 py-3">
                      <Pill value={r.status} />
                      {r.status === 'paid' && r.paid_at && (
                        <p className="text-xs text-slate-400 mt-0.5">{shortDate(r.paid_at)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => { setPaying(r); setNote(''); }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Mark reward as paid"
        footer={
          <>
            <button
              onClick={() => setPaying(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmPay}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Confirm paid'}
            </button>
          </>
        }
      >
        {paying && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm you have paid{' '}
              <span className="font-semibold text-slate-900">{money(paying.amount, paying.currency)}</span>{' '}
              to <span className="font-semibold text-slate-900">{payeeLabel(paying.payee)}</span>. This
              only records the payout — no money moves from here.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How it was paid (optional)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="UPI ref 4023…, or 'applied as discount on invoice #12'"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const AdminReferrals = () => {
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every account has a code. Partners without an account get one you create here. A referral
          earns its reward when the referred person's first payment is approved — settle payouts on
          the Rewards tab.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab notify={notify} />}
      {tab === 'referrals' && <ReferralsTab notify={notify} />}
      {tab === 'codes' && <CodesTab notify={notify} />}
      {tab === 'rewards' && <RewardsTab notify={notify} />}
    </AdminLayout>
  );
};
