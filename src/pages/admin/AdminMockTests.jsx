import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getMockTests,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  togglePublishMockTest,
  getSubjects,
} from '@/api/adminService';
import { Plus, Eye, Trash2, ToggleLeft, ToggleRight, PieChart, Pencil } from 'lucide-react';

// ── Mini SVG Pie (difficulty preview) ────────────────────────────────────────
const MiniPie = ({ easy, medium, hard }) => {
  const data = [
    { v: Number(easy) || 0, color: '#22c55e' },
    { v: Number(medium) || 0, color: '#f59e0b' },
    { v: Number(hard) || 0, color: '#ef4444' },
  ].filter((d) => d.v > 0);

  const total = data.reduce((s, d) => s + d.v, 1);
  const cx = 24; const cy = 24; const r = 20;
  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sweep = (d.v / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} Z`, color: d.color };
  });

  if (data.length === 0) return <div className="w-12 h-12 bg-slate-100 rounded-full" />;
  return (
    <svg width={48} height={48}>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth={1.5} />)}
    </svg>
  );
};

// ── Badges ────────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) =>
  type === 'fixed' ? (
    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Fixed</span>
  ) : (
    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">Dynamic</span>
  );

const PublishBadge = ({ published }) =>
  published ? (
    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Published</span>
  ) : (
    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">Draft</span>
  );

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {toast.message}
    </div>
  );
};

// ── Form helpers ──────────────────────────────────────────────────────────────
const FInput = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" {...props} />
  </div>
);

const FTextarea = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" rows={3} {...props} />
  </div>
);

const FToggle = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-brand-blue' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

// ── Fixed tab form ────────────────────────────────────────────────────────────
const EMPTY_FIXED = {
  title: '', description: '', duration_minutes: 60, total_marks: 100,
  randomize_questions: false, randomize_options: false, starts_at: '', ends_at: '',
};

const EMPTY_DYNAMIC = {
  title: '', description: '', duration_minutes: 60, total_marks: 100,
  randomize_options: false,
  subject_rows: [{ subject_id: '', count: 10 }],
  easy_pct: '', medium_pct: '', hard_pct: '',
};

const FixedForm = ({ form, setForm }) => (
  <div className="space-y-4">
    <FInput label="Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. AMC Recall 2024 Mock" />
    <FTextarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
    <div className="grid grid-cols-2 gap-4">
      <FInput label="Duration (minutes)" type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} />
      <FInput label="Total Marks" type="number" min={0} value={form.total_marks} onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))} />
    </div>
    <div className="space-y-2">
      <FToggle label="Randomize Question Order" value={form.randomize_questions} onChange={(v) => setForm((p) => ({ ...p, randomize_questions: v }))} />
      <FToggle label="Randomize Option Order" value={form.randomize_options} onChange={(v) => setForm((p) => ({ ...p, randomize_options: v }))} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <FInput label="Starts At (optional)" type="datetime-local" value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))} />
      <FInput label="Ends At (optional)" type="datetime-local" value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))} />
    </div>
  </div>
);

const DynamicForm = ({ form, setForm, subjects }) => {
  const addRow = () => setForm((p) => ({ ...p, subject_rows: [...p.subject_rows, { subject_id: '', count: 10 }] }));
  const removeRow = (i) => setForm((p) => ({ ...p, subject_rows: p.subject_rows.filter((_, idx) => idx !== i) }));
  const updateRow = (i, key, val) => setForm((p) => {
    const rows = [...p.subject_rows];
    rows[i] = { ...rows[i], [key]: val };
    return { ...p, subject_rows: rows };
  });

  const pctTotal = (Number(form.easy_pct) || 0) + (Number(form.medium_pct) || 0) + (Number(form.hard_pct) || 0);

  return (
    <div className="space-y-5">
      <FInput label="Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Dynamic AMC Practice" />
      <FTextarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-4">
        <FInput label="Duration (minutes)" type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} />
        <FInput label="Total Marks" type="number" min={0} value={form.total_marks} onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))} />
      </div>
      <FToggle label="Randomize Option Order" value={form.randomize_options} onChange={(v) => setForm((p) => ({ ...p, randomize_options: v }))} />

      {/* Subject rows */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">Subject Configuration</label>
          <button type="button" onClick={addRow} className="text-xs text-brand-blue hover:underline">+ Add Subject</button>
        </div>
        <div className="space-y-2">
          {form.subject_rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                value={row.subject_id}
                onChange={(e) => updateRow(i, 'subject_id', e.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input
                type="number"
                min={1}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                value={row.count}
                onChange={(e) => updateRow(i, 'count', e.target.value)}
                placeholder="Count"
              />
              {form.subject_rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 text-lg leading-none">×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty distribution */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Difficulty Distribution (optional — must total 100%)</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 grid grid-cols-3 gap-2">
            {[
              { key: 'easy_pct', label: 'Easy %', color: '#22c55e' },
              { key: 'medium_pct', label: 'Medium %', color: '#f59e0b' },
              { key: 'hard_pct', label: 'Hard %', color: '#ef4444' },
            ].map(({ key, label, color }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-medium" style={{ color }}>{label}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <MiniPie easy={form.easy_pct} medium={form.medium_pct} hard={form.hard_pct} />
        </div>
        {pctTotal > 0 && pctTotal !== 100 && (
          <p className="text-xs text-red-500 mt-1">Total is {pctTotal}% — must equal 100%</p>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminMockTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState('fixed'); // 'fixed' | 'dynamic'
  const [fixedForm, setFixedForm] = useState(EMPTY_FIXED);
  const [dynamicForm, setDynamicForm] = useState(EMPTY_DYNAMIC);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [mtRes, subRes] = await Promise.all([getMockTests(), getSubjects()]);
      setTests(mtRes.data?.data ?? mtRes.data ?? []);
      setSubjects(subRes.data?.data ?? subRes.data ?? []);
    } catch {
      showToast('error', 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setFixedForm(EMPTY_FIXED);
    setDynamicForm(EMPTY_DYNAMIC);
    setTab('fixed');
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditTarget(t);
    if (t.test_type === 'dynamic') {
      const cfg = t.configuration_json ?? {};
      setDynamicForm({
        title: t.title, description: t.description ?? '',
        duration_minutes: t.duration_minutes ?? 60, total_marks: t.total_marks ?? 100,
        randomize_options: t.randomize_options ?? false,
        subject_rows: cfg.subjects?.length ? cfg.subjects.map((s) => ({ subject_id: s.subject_id, count: s.count })) : [{ subject_id: '', count: 10 }],
        easy_pct: cfg.difficulty?.easy ?? '', medium_pct: cfg.difficulty?.medium ?? '', hard_pct: cfg.difficulty?.hard ?? '',
      });
      setTab('dynamic');
    } else {
      setFixedForm({
        title: t.title, description: t.description ?? '',
        duration_minutes: t.duration_minutes ?? 60, total_marks: t.total_marks ?? 100,
        randomize_questions: t.randomize_questions ?? false, randomize_options: t.randomize_options ?? false,
        starts_at: t.starts_at?.slice(0, 16) ?? '', ends_at: t.ends_at?.slice(0, 16) ?? '',
      });
      setTab('fixed');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const isFixed = tab === 'fixed';
    const f = isFixed ? fixedForm : dynamicForm;
    if (!f.title) { showToast('error', 'Title is required'); return; }

    let payload;
    if (isFixed) {
      payload = { ...fixedForm, test_type: 'fixed' };
      if (!payload.starts_at) delete payload.starts_at;
      if (!payload.ends_at) delete payload.ends_at;
    } else {
      const pctTotal = (Number(dynamicForm.easy_pct) || 0) + (Number(dynamicForm.medium_pct) || 0) + (Number(dynamicForm.hard_pct) || 0);
      if (pctTotal > 0 && pctTotal !== 100) {
        showToast('error', 'Difficulty percentages must total 100%'); return;
      }
      const cfg = {
        subjects: dynamicForm.subject_rows
          .filter((r) => r.subject_id)
          .map((r) => ({ subject_id: r.subject_id, count: Number(r.count) })),
      };
      if (pctTotal === 100) {
        cfg.difficulty = { easy: Number(dynamicForm.easy_pct), medium: Number(dynamicForm.medium_pct), hard: Number(dynamicForm.hard_pct) };
      }
      payload = {
        title: dynamicForm.title, description: dynamicForm.description,
        duration_minutes: dynamicForm.duration_minutes, total_marks: dynamicForm.total_marks,
        randomize_options: dynamicForm.randomize_options,
        test_type: 'dynamic', configuration_json: cfg,
      };
    }

    setSaving(true);
    try {
      if (editTarget) {
        await updateMockTest(editTarget.id, payload);
      } else {
        await createMockTest(payload);
      }
      showToast('success', editTarget ? 'Test updated' : 'Test created');
      setModalOpen(false);
      load();
    } catch {
      showToast('error', 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (t) => {
    const prev = t.is_published;
    setTests((ts) => ts.map((x) => x.id === t.id ? { ...x, is_published: !x.is_published } : x));
    try {
      await togglePublishMockTest(t.id);
    } catch {
      setTests((ts) => ts.map((x) => x.id === t.id ? { ...x, is_published: prev } : x));
      showToast('error', 'Toggle failed');
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMockTest(deleteTarget.id);
      showToast('success', 'Test deleted');
      load();
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete Mock Test?"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />

      {/* Create/edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Mock Test' : 'Create Mock Test'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Test'}
            </button>
          </>
        }
      >
        {/* Tabs */}
        {!editTarget && (
          <div className="flex border-b border-slate-200 mb-5 -mx-6 px-6">
            {[{ key: 'fixed', label: 'Fixed Test' }, { key: 'dynamic', label: 'Dynamic Test' }].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t.key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'fixed'
          ? <FixedForm form={fixedForm} setForm={setFixedForm} />
          : <DynamicForm form={dynamicForm} setForm={setDynamicForm} subjects={subjects} />}
      </Modal>

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Mock Tests</h1>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover">
            <Plus className="w-4 h-4" /> Create Test
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Questions</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : tests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No mock tests yet.</td></tr>
              ) : (
                tests.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/admin/mock-tests/${t.id}`} className="font-medium text-slate-800 hover:text-brand-blue transition-colors">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={t.test_type} /></td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">
                      {t.test_type === 'dynamic' ? '—' : (t.questions_count ?? t.question_count ?? '—')}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">
                      {t.duration_minutes ? `${t.duration_minutes} min` : '—'}
                    </td>
                    <td className="px-4 py-3"><PublishBadge published={t.is_published} /></td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">{fmt(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/mock-tests/${t.id}`} className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors" title="View / Edit Questions">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePublishToggle(t)} className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" title={t.is_published ? 'Unpublish' : 'Publish'}>
                          {t.is_published ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
