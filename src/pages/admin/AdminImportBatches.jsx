import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getImportBatches,
  createImportBatch,
  getImportBatch,
  approveImportBatch,
  deleteImportBatch,
} from '@/api/adminService';
import {
  Plus, Eye, Check, Trash2, X, CheckCircle2, Clock, AlertCircle, Circle, Copy,
} from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    processing: { cls: 'bg-yellow-100 text-yellow-700', label: 'Processing' },
    completed: { cls: 'bg-green-100 text-green-700', label: 'Completed' },
    failed: { cls: 'bg-red-100 text-red-700', label: 'Failed' },
  };
  const { cls = 'bg-slate-100 text-slate-600', label = status } = map[status] ?? {};
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
      )}
      {label}
    </span>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ status }) => {
  const steps = [
    { label: 'Created', done: true },
    { label: 'Processing', done: status !== 'processing' },
    { label: 'Ready', done: status === 'completed' || status === 'failed' },
    { label: 'Approved', done: false },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step.done
                  ? 'bg-green-500 text-white'
                  : status === 'failed' && i === 1
                  ? 'bg-red-400 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 mb-3 mx-0.5 ${step.done ? 'bg-green-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Preview slide-over ────────────────────────────────────────────────────────
const PreviewPanel = ({ batchId, onClose, onApprove }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    getImportBatch(batchId)
      .then((res) => setData(res.data?.data ?? res.data))
      .catch(() => showToast('error', 'Failed to load batch'))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveImportBatch(batchId);
      showToast('success', 'Batch approved!');
      setTimeout(() => { onApprove(); onClose(); }, 1000);
    } catch {
      showToast('error', 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const questions = data?.import_logs?.questions ?? data?.questions ?? [];
  const failed = data?.import_logs?.failed_questions ?? data?.failed_questions ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Batch Preview</h2>
            {data && <p className="text-xs text-slate-500 mt-0.5">{data.title}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {toast && (
          <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            {data && (
              <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-6 text-sm shrink-0">
                <div><span className="text-slate-500">Total:</span> <strong>{data.total_questions ?? questions.length}</strong></div>
                <div><span className="text-slate-500">Imported:</span> <strong className="text-green-600">{data.imported_questions ?? questions.length}</strong></div>
                {failed.length > 0 && (
                  <div className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {failed.length} failed
                  </div>
                )}
              </div>
            )}

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No questions parsed yet.</p>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-800 font-medium leading-relaxed flex-1">{q.question_text ?? q.text}</p>
                      <span className="text-xs text-slate-400 shrink-0">#{i + 1}</span>
                    </div>
                    {(q.options ?? []).map((opt, j) => (
                      <div
                        key={j}
                        className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                          opt.is_correct ? 'bg-green-50 text-green-800 border border-green-200' : 'text-slate-600'
                        }`}
                      >
                        <span className="font-semibold shrink-0">{opt.option_key ?? String.fromCharCode(65 + j)}.</span>
                        <span>{opt.option_text}</span>
                        {opt.is_correct && <Check className="w-4 h-4 ml-auto shrink-0 text-green-600" />}
                      </div>
                    ))}
                    {q.subject && (
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>Subject: <strong>{q.subject}</strong></span>
                        {q.difficulty && <span>· {q.difficulty}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Approve button */}
            {data?.status === 'completed' && (
              <div className="px-6 py-4 border-t border-slate-200 shrink-0">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {approving ? 'Approving…' : 'Approve & Import Questions'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminImportBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [newBatchId, setNewBatchId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ title: '', questions_pdf: '', answers_pdf: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const res = await getImportBatches();
      setBatches(res.data?.data ?? res.data ?? []);
    } catch {
      showToast('error', 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title) { showToast('error', 'Title is required'); return; }
    setSaving(true);
    try {
      const res = await createImportBatch(form);
      const batch = res.data?.data ?? res.data;
      setNewBatchId(res.data?.batch_id);
      setCreateModal(false);
      setForm({ title: '', questions_pdf: '', answers_pdf: '' });
      showToast('success', 'Batch created');
      load();
    } catch {
      showToast('error', 'Failed to create batch');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approveImportBatch(approveTarget.id);
      showToast('success', 'Batch approved');
      load();
    } catch {
      showToast('error', 'Approval failed');
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteImportBatch(deleteTarget.id);
      showToast('success', 'Batch deleted');
      load();
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Rollback & Delete Batch?"
        message={`This will permanently delete all questions imported from "${deleteTarget?.title}". This cannot be undone.`}
      />

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve Batch?"
        message={`Approve "${approveTarget?.title}"? This will add all parsed questions to the question bank.`}
        confirmLabel="Approve"
        confirmClass="bg-green-600 hover:bg-green-700 text-white"
      />

      {/* Preview panel */}
      {previewId && (
        <PreviewPanel
          batchId={previewId}
          onClose={() => setPreviewId(null)}
          onApprove={load}
        />
      )}

      {/* Batch created info */}
      {newBatchId && (
        <div className="fixed top-4 right-4 z-60 max-w-sm bg-white border border-green-200 rounded-xl shadow-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Batch Created!</p>
              <p className="text-xs text-slate-500 mt-1">Share this ID with the Python service:</p>
              <div className="mt-2 flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                <code className="text-sm font-mono text-slate-800 flex-1">{newBatchId}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(String(newBatchId))}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button onClick={() => setNewBatchId(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="New Import Batch"
        size="sm"
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.title}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Batch'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Workflow hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Import workflow:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Create batch here → get a batch ID</li>
              <li>Share batch ID with the Python PDF parser</li>
              <li>Parser uploads questions automatically</li>
              <li>Come back to preview &amp; approve</li>
            </ol>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Title *</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Recall 2024 – Batch 1"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Questions PDF path / URL</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={form.questions_pdf}
              onChange={(e) => setForm((p) => ({ ...p, questions_pdf: e.target.value }))}
              placeholder="/uploads/questions.pdf"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Answers PDF path / URL</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={form.answers_pdf}
              onChange={(e) => setForm((p) => ({ ...p, answers_pdf: e.target.value }))}
              placeholder="/uploads/answers.pdf"
            />
          </div>
        </div>
      </Modal>

      {/* Main content */}
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Import Batches</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage PDF import pipeline — create, preview, and approve batches.</p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover"
          >
            <Plus className="w-4 h-4" /> New Import
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Workflow</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Total Q</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Imported</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No import batches yet.</td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{b.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {b.id}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StepIndicator status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">{b.total_questions ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">{b.imported_questions ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">{fmt(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewId(b.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === 'completed' && (
                          <button
                            onClick={() => setApproveTarget(b)}
                            className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Rollback & Delete"
                        >
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
