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
  updateQuestion,
  getSubjects,
  getSubjectTopics,
} from '@/api/adminService';
import {
  Plus, Eye, Check, Trash2, X, CheckCircle2, AlertCircle, Copy, Pencil, Save,
} from 'lucide-react';
import { Lightbox } from '@/components/ui/Lightbox';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    processing: { cls: 'bg-yellow-100 text-yellow-700', label: 'Processing' },
    completed:  { cls: 'bg-green-100 text-green-700',   label: 'Completed'  },
    failed:     { cls: 'bg-red-100 text-red-700',       label: 'Failed'     },
    approved:   { cls: 'bg-blue-100 text-blue-700',     label: 'Approved'   },
  };
  const { cls = 'bg-slate-100 text-slate-600', label = status } = map[status] ?? {};
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
      {label}
    </span>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ status }) => {
  const approved      = status === 'approved';
  const readyOrBeyond = status === 'completed' || approved;
  const failedStep    = status === 'failed';

  const steps = [
    { label: 'Created',    done: true,          failed: false },
    { label: 'Processing', done: readyOrBeyond, failed: failedStep },
    { label: 'Ready',      done: readyOrBeyond, failed: false },
    { label: 'Approved',   done: approved,      failed: false },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step.done ? 'bg-green-500 text-white' : step.failed ? 'bg-red-400 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {step.failed ? '✗' : step.done ? '✓' : i + 1}
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

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ d }) => {
  if (!d) return null;
  const cls = d === 'hard' ? 'bg-red-50 text-red-500' : d === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600';
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{d}</span>;
};

// ── Inline image with error fallback + click-to-expand ───────────────────────
const PreviewImage = ({ src, className, onClick }) => {
  const [broken, setBroken] = useState(false);
  if (!src) return null;
  if (broken) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg text-slate-400 text-xs ${className}`}
        style={{ minHeight: 48 }}>
        broken image
      </div>
    );
  }
  return (
    <div className={`relative group ${onClick ? 'cursor-zoom-in' : ''}`} onClick={onClick ? () => onClick(src) : undefined}>
      <img
        src={src}
        alt=""
        className={className}
        onError={() => setBroken(true)}
        draggable={false}
      />
      {onClick && (
        <div className="absolute inset-0 rounded-lg ring-0 group-hover:ring-2 ring-brand-blue/40 transition-all pointer-events-none" />
      )}
    </div>
  );
};

// ── Question view card ────────────────────────────────────────────────────────
const QuestionView = ({ q, idx, onEdit, onExpand }) => (
  <>
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-slate-800 font-medium leading-relaxed flex-1">{q.question_text}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-slate-400 font-mono">#{q.question_number ?? idx + 1}</span>
        <button onClick={onEdit} className="p-1 text-slate-300 hover:text-brand-blue transition-colors" title="Edit question">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {q.question_image && (
      <PreviewImage
        src={q.question_image}
        className="max-w-xs rounded-lg border border-slate-200 object-contain"
        onClick={onExpand}
      />
    )}

    {/* additional images (can be duplicates — visible here so admin knows to edit) */}
    {Array.isArray(q.question_images) && q.question_images.filter(u => u !== q.question_image).length > 0 && (
      <div className="flex flex-wrap gap-2">
        {q.question_images.filter(u => u !== q.question_image).map((img, k) => (
          <PreviewImage key={k} src={img} className="h-16 rounded border border-slate-200 object-contain" onClick={onExpand} />
        ))}
      </div>
    )}

    {[...(q.options ?? [])].sort((a, b) => (a.option_key ?? '').localeCompare(b.option_key ?? '')).map((opt, j) => (
      <div key={opt.id ?? j} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
        opt.is_correct ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-slate-50 text-slate-600'
      }`}>
        <span className="font-semibold shrink-0">{opt.option_key}.</span>
        <span className="flex-1">{opt.option_text}</span>
        {opt.is_correct && <Check className="w-4 h-4 ml-auto shrink-0 text-green-600" />}
      </div>
    ))}

    <div className="flex flex-wrap gap-2 pt-1">
      {q.subject?.name && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{q.subject.name}</span>}
      {q.topic?.name   && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{q.topic.name}</span>}
      <DiffBadge d={q.difficulty} />
      {!q.subject_id && <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full">⚠ no subject</span>}
    </div>
  </>
);

// ── Question edit form ────────────────────────────────────────────────────────
const QuestionEditForm = ({ q, idx, subjects, topicsBySubject, onLoadTopics, onSave, onCancel, saving, onExpand }) => {
  const [form, setForm] = useState(() => ({
    question_text:   q.question_text ?? '',
    explanation:     q.explanation ?? '',
    subject_id:      String(q.subject_id ?? ''),
    topic_id:        String(q.topic_id ?? ''),
    difficulty:      q.difficulty ?? '',
    question_image:  q.question_image ?? '',
    question_images: Array.isArray(q.question_images) ? [...q.question_images] : [],
    answer_images:   Array.isArray(q.answer_images) ? [...q.answer_images] : [],
    options: [...(q.options ?? [])]
      .sort((a, b) => (a.option_key ?? '').localeCompare(b.option_key ?? ''))
      .map(o => ({ option_key: o.option_key, option_text: o.option_text ?? '', is_correct: o.is_correct ?? false })),
  }));

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubject = (subjectId) => {
    setForm(p => ({ ...p, subject_id: subjectId, topic_id: '' }));
    onLoadTopics(subjectId);
  };

  const [newQImg, setNewQImg] = useState('');
  const [newAImg, setNewAImg] = useState('');

  const removeQImg = (i) => setForm(p => ({ ...p, question_images: p.question_images.filter((_, idx) => idx !== i) }));
  const removeAImg = (i) => setForm(p => ({ ...p, answer_images:   p.answer_images.filter((_, idx) => idx !== i) }));

  const addQImg = () => {
    const url = newQImg.trim();
    if (!url) return;
    setForm(p => ({ ...p, question_images: [...p.question_images, url] }));
    setNewQImg('');
  };
  const addAImg = () => {
    const url = newAImg.trim();
    if (!url) return;
    setForm(p => ({ ...p, answer_images: [...p.answer_images, url] }));
    setNewAImg('');
  };

  const setOptionText    = (i, val)  => setForm(p => ({ ...p, options: p.options.map((o, k) => k === i ? { ...o, option_text: val } : o) }));
  const setCorrectOption = (i)       => setForm(p => ({ ...p, options: p.options.map((o, k) => ({ ...o, is_correct: k === i })) }));

  const topics = topicsBySubject[form.subject_id] ?? [];

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Question Text</label>
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
          rows={4}
          value={form.question_text}
          onChange={e => set('question_text', e.target.value)}
        />
      </div>

      {/* Primary Image */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Primary Image</label>
        {form.question_image && (
          <div className="flex items-start gap-3">
            <PreviewImage
              src={form.question_image}
              className="max-h-32 max-w-[220px] rounded-lg border border-slate-200 object-contain bg-slate-50"
              onClick={onExpand}
            />
            <button
              type="button"
              onClick={() => set('question_image', '')}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        )}
        <input
          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          placeholder={form.question_image ? 'Replace with another Cloudinary URL…' : 'Paste Cloudinary image URL (or leave blank)…'}
          value={form.question_image}
          onChange={e => set('question_image', e.target.value)}
        />
      </div>

      {/* Additional question images */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Additional Question Images
          {form.question_images.length > 0 && (
            <span className="ml-1 font-normal text-slate-400">— hover thumbnail to remove</span>
          )}
        </label>
        {form.question_images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {form.question_images.map((img, k) => (
              <div key={k} className="relative group">
                <PreviewImage src={img} className="h-20 w-auto max-w-[140px] rounded-lg border border-slate-200 object-contain bg-slate-50" onClick={onExpand} />
                <button
                  type="button"
                  onClick={() => removeQImg(k)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >×</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No additional images.</p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            placeholder="Paste Cloudinary URL to add a question image…"
            value={newQImg}
            onChange={e => setNewQImg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQImg(); } }}
          />
          <button
            type="button"
            onClick={addQImg}
            disabled={!newQImg.trim()}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-colors shrink-0"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Subject</label>
          <select
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            value={form.subject_id}
            onChange={e => handleSubject(e.target.value)}
          >
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Topic</label>
          <select
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            value={form.topic_id}
            onChange={e => set('topic_id', e.target.value)}
            disabled={!form.subject_id}
          >
            <option value="">No topic</option>
            {topics.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Difficulty</label>
          <select
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            value={form.difficulty}
            onChange={e => set('difficulty', e.target.value)}
          >
            <option value="">—</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Options — select correct answer
        </label>
        {form.options.map((opt, i) => (
          <div
            key={opt.option_key ?? i}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              opt.is_correct ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name={`correct-${q.id}`}
              checked={opt.is_correct}
              onChange={() => setCorrectOption(i)}
              className="accent-green-600 shrink-0 cursor-pointer"
            />
            <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
              opt.is_correct ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {opt.option_key}
            </span>
            <input
              className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              value={opt.option_text}
              onChange={e => setOptionText(i, e.target.value)}
            />
            {opt.is_correct && <Check className="w-4 h-4 text-green-600 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Explanation <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-blue"
          rows={2}
          placeholder="Explanation for the correct answer…"
          value={form.explanation}
          onChange={e => set('explanation', e.target.value)}
        />
      </div>

      {/* Answer / explanation images */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Answer / Explanation Images
          {form.answer_images.length > 0 && (
            <span className="ml-1 font-normal text-slate-400">— hover thumbnail to remove</span>
          )}
        </label>
        {form.answer_images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {form.answer_images.map((img, k) => (
              <div key={k} className="relative group">
                <PreviewImage src={img} className="h-20 w-auto max-w-[140px] rounded-lg border border-slate-200 object-contain bg-slate-50" onClick={onExpand} />
                <button
                  type="button"
                  onClick={() => removeAImg(k)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >×</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No answer images yet.</p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            placeholder="Paste Cloudinary URL to add an answer/explanation image…"
            value={newAImg}
            onChange={e => setNewAImg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAImg(); } }}
          />
          <button
            type="button"
            onClick={addAImg}
            disabled={!newAImg.trim()}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-colors shrink-0"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving}
          className="px-4 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ── Preview slide-over ────────────────────────────────────────────────────────
const PreviewPanel = ({ batchId, onClose, onApprove }) => {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [approving,      setApproving]      = useState(false);
  const [toast,          setToast]          = useState(null);
  const [subjects,       setSubjects]       = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [editingId,      setEditingId]      = useState(null);
  const [editSaving,     setEditSaving]     = useState(false);
  const [lightboxSrc,    setLightboxSrc]    = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      getImportBatch(batchId),
      getSubjects().catch(() => ({ data: [] })),
    ]).then(([batchRes, subRes]) => {
      setData(batchRes.data?.data ?? batchRes.data);
      setSubjects(subRes.data?.data ?? subRes.data ?? []);
    }).catch(() => showToast('error', 'Failed to load batch'))
      .finally(() => setLoading(false));
  }, [batchId]);

  const loadTopics = useCallback(async (subjectId) => {
    if (!subjectId || topicsBySubject[subjectId]) return;
    try {
      const r = await getSubjectTopics(subjectId);
      setTopicsBySubject(p => ({ ...p, [subjectId]: r.data?.data ?? r.data ?? [] }));
    } catch {}
  }, [topicsBySubject]);

  const startEdit = (q) => {
    setEditingId(q.id);
    // Pre-load topics if subject already set
    if (q.subject_id) loadTopics(String(q.subject_id));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (q, form) => {
    setEditSaving(true);
    try {
      const payload = {
        question_text:   form.question_text,
        explanation:     form.explanation  || null,
        subject_id:      form.subject_id   || null,
        topic_id:        form.topic_id     || null,
        difficulty:      form.difficulty   || null,
        question_image:  form.question_image || null,
        question_images: form.question_images.length ? form.question_images : null,
        answer_images:   form.answer_images.length   ? form.answer_images   : null,
        options: form.options.map(o => ({
          option_key:  o.option_key,
          option_text: o.option_text,
          is_correct:  o.is_correct,
        })),
      };

      const res = await updateQuestion(q.id, payload);
      const updated = res.data?.data ?? res.data;

      setData(prev => ({
        ...prev,
        questions: prev.questions.map(existing =>
          existing.id !== q.id ? existing : {
            ...existing,
            ...updated,
            // Ensure relations from response, fallback to reconstructed
            subject: updated.subject ?? (form.subject_id
              ? { id: form.subject_id, name: subjects.find(s => String(s.id) === form.subject_id)?.name }
              : null),
            topic: updated.topic ?? (form.topic_id
              ? { id: form.topic_id, name: (topicsBySubject[form.subject_id] ?? []).find(t => String(t.id) === form.topic_id)?.name }
              : null),
            options: (updated.options ?? form.options).sort((a, b) => a.option_key.localeCompare(b.option_key)),
          }
        ),
      }));

      setEditingId(null);
      showToast('success', 'Question saved');
    } catch {
      showToast('error', 'Save failed');
    } finally {
      setEditSaving(false);
    }
  };

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

  const questions     = data?.questions ?? [];
  const failedCount   = data?.failed_questions ?? 0;
  const failedDetails = data?.import_logs?.failed_details ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={editingId ? undefined : onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Batch Preview &amp; Edit</h2>
            {data && <p className="text-xs text-slate-500 mt-0.5">{data.title}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats bar */}
            {data && (
              <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-5 text-sm shrink-0 flex-wrap">
                <div><span className="text-slate-500">Total:</span> <strong>{data.total_questions ?? questions.length}</strong></div>
                <div><span className="text-slate-500">Imported:</span> <strong className="text-green-600">{data.imported_questions ?? questions.length}</strong></div>
                {failedCount > 0 && (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {failedCount} failed
                  </span>
                )}
                <span className="ml-auto text-[11px] text-slate-400 italic hidden sm:block">
                  Click <Pencil className="inline w-3 h-3" /> to edit any question
                </span>
                {failedDetails.length > 0 && (
                  <details className="w-full mt-1">
                    <summary className="text-xs text-red-500 cursor-pointer">Show failed details</summary>
                    <div className="mt-1 space-y-1">
                      {failedDetails.map((f, i) => (
                        <p key={i} className="text-xs text-red-400">Q#{f.question_number}: {f.error}</p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Question list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No questions found for this batch.</p>
              ) : (
                questions.map((q, i) => {
                  const isEditing = editingId === q.id;
                  return (
                    <div
                      key={q.id ?? i}
                      className={`border rounded-xl p-4 space-y-3 transition-shadow ${
                        isEditing ? 'border-brand-blue shadow-md' : 'border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-semibold text-brand-blue">
                              Editing Q#{q.question_number ?? i + 1}
                            </span>
                            <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-600">
                              ✕ cancel
                            </button>
                          </div>
                          <QuestionEditForm
                            q={q}
                            idx={i}
                            subjects={subjects}
                            topicsBySubject={topicsBySubject}
                            onLoadTopics={loadTopics}
                            onSave={(form) => saveEdit(q, form)}
                            onCancel={cancelEdit}
                            saving={editSaving}
                            onExpand={setLightboxSrc}
                          />
                        </>
                      ) : (
                        <QuestionView
                          q={q}
                          idx={i}
                          onEdit={() => startEdit(q)}
                          onExpand={setLightboxSrc}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Approve footer */}
            {(data?.status === 'completed' || data?.status === 'approved') && (
              <div className="px-6 py-4 border-t border-slate-200 shrink-0 space-y-2">
                {data.status === 'approved' && (
                  <p className="text-xs text-blue-600 text-center">
                    ✓ This batch is already approved. You can still edit individual questions above.
                  </p>
                )}
                {data.status === 'completed' && (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {approving ? 'Approving…' : 'Approve & Import Questions'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox — sits above the panel (z-[200]) */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminImportBatches = () => {
  const [batches,       setBatches]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [createModal,   setCreateModal]   = useState(false);
  const [previewId,     setPreviewId]     = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [newBatchId,    setNewBatchId]    = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);

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

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <AdminLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Import workflow:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Create batch here → get a batch ID</li>
              <li>Share batch ID with the Python PDF parser</li>
              <li>Parser uploads questions automatically</li>
              <li>Preview, edit any issues, then approve</li>
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
            <p className="text-sm text-slate-500 mt-0.5">Manage PDF import pipeline — create, preview, edit, and approve batches.</p>
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
                    <td className="px-4 py-3 hidden md:table-cell"><StepIndicator status={b.status} /></td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">{b.total_questions ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">{b.imported_questions ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">{fmt(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewId(b.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors"
                          title="Preview & Edit"
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
