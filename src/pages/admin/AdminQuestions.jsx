import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getQuestionsAdmin,
  getQuestionAdmin,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestion,
  getSubjects,
  getSubjectTopics,
} from '@/api/adminService';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SOURCE_TYPES = ['qbank', 'recall', 'mock', 'previous_year'];
const QUESTION_TYPES = ['single_choice', 'multiple_choice', 'true_false', 'image_based'];
const OPT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

const EMPTY_FORM = {
  subject_id: '',
  topic_id: '',
  question_text: '',
  explanation: '',
  difficulty: 'easy',
  question_type: 'single_choice',
  source_type: 'qbank',
  source_year: '',
  marks: 1,
  negative_marks: 0,
  options: [
    { option_key: 'A', option_text: '', is_correct: true },
    { option_key: 'B', option_text: '', is_correct: false },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <input
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      {...props}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <select
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
      {...props}
    >
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <textarea
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      rows={4}
      {...props}
    />
  </div>
);

const Badge = ({ children, color }) => {
  const colors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
    qbank: 'bg-blue-100 text-blue-700',
    recall: 'bg-purple-100 text-purple-700',
    mock: 'bg-amber-100 text-amber-700',
    previous_year: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[color] ?? 'bg-slate-100 text-slate-600'}`}>
      {children}
    </span>
  );
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {toast.message}
    </div>
  );
};

// ── Question Form ─────────────────────────────────────────────────────────────
const QuestionForm = ({ form, setForm, subjects, topics, loadTopics }) => {
  const isMulti = form.question_type === 'multiple_choice';

  const handleOpt = (idx, field, value) => {
    setForm((prev) => {
      const opts = prev.options.map((o, i) => {
        if (field === 'is_correct' && !isMulti) {
          return { ...o, is_correct: i === idx };
        }
        return i === idx ? { ...o, [field]: value } : o;
      });
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { option_key: OPT_KEYS[prev.options.length] ?? String.fromCharCode(65 + prev.options.length), option_text: '', is_correct: false },
      ],
    }));
  };

  const removeOption = (idx) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-5">
      {/* Subject / Topic */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Subject *"
          value={form.subject_id}
          onChange={(e) => {
            setForm((p) => ({ ...p, subject_id: e.target.value, topic_id: '' }));
            if (e.target.value) loadTopics(e.target.value);
          }}
        >
          <option value="">Select subject</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select
          label="Topic"
          value={form.topic_id}
          onChange={(e) => setForm((p) => ({ ...p, topic_id: e.target.value }))}
          disabled={!form.subject_id}
        >
          <option value="">Select topic</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </div>

      {/* Question text */}
      <Textarea
        label="Question Text *"
        value={form.question_text}
        onChange={(e) => setForm((p) => ({ ...p, question_text: e.target.value }))}
        placeholder="Enter the question..."
      />

      {/* Explanation */}
      <Textarea
        label="Explanation"
        value={form.explanation}
        onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
        placeholder="Explain the correct answer..."
        rows={3}
      />

      {/* Meta row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Select
          label="Difficulty"
          value={form.difficulty}
          onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
        >
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </Select>
        <Select
          label="Question Type"
          value={form.question_type}
          onChange={(e) => setForm((p) => ({ ...p, question_type: e.target.value }))}
        >
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select
          label="Source Type"
          value={form.source_type}
          onChange={(e) => setForm((p) => ({ ...p, source_type: e.target.value }))}
        >
          {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Input
          label="Source Year"
          type="number"
          value={form.source_year}
          onChange={(e) => setForm((p) => ({ ...p, source_year: e.target.value }))}
          placeholder="e.g. 2023"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Marks"
          type="number"
          min={0}
          step={0.5}
          value={form.marks}
          onChange={(e) => setForm((p) => ({ ...p, marks: e.target.value }))}
        />
        <Input
          label="Negative Marks"
          type="number"
          min={0}
          step={0.25}
          value={form.negative_marks}
          onChange={(e) => setForm((p) => ({ ...p, negative_marks: e.target.value }))}
        />
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Options * {isMulti ? '(checkboxes — multiple correct)' : '(radio — one correct)'}
          </label>
          {form.options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-xs text-brand-blue hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          )}
        </div>
        <div className="space-y-2">
          {form.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                {opt.option_key}
              </span>
              <input
                className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                value={opt.option_text}
                onChange={(e) => handleOpt(idx, 'option_text', e.target.value)}
                placeholder={`Option ${opt.option_key}`}
              />
              {/* Correct toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isMulti ? (
                  <input
                    type="checkbox"
                    checked={opt.is_correct}
                    onChange={(e) => handleOpt(idx, 'is_correct', e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                ) : (
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.is_correct}
                    onChange={() => handleOpt(idx, 'is_correct', true)}
                    className="w-4 h-4 accent-green-600"
                  />
                )}
                <span className="text-xs text-slate-400">Correct</span>
              </div>
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="p-1 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [filters, setFilters] = useState({
    subject_id: '',
    topic_id: '',
    difficulty: '',
    source_type: '',
    is_active: '',
    search: '',
    page: 1,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const searchTimer = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadQuestions = useCallback(async (f) => {
    setLoading(true);
    const params = {};
    if (f.subject_id) params.subject_id = f.subject_id;
    if (f.topic_id) params.topic_id = f.topic_id;
    if (f.difficulty) params.difficulty = f.difficulty;
    if (f.source_type) params.source_type = f.source_type;
    if (f.is_active !== '') params.is_active = f.is_active;
    if (f.search) params.search = f.search;
    params.page = f.page;
    params.limit = 20;

    try {
      const res = await getQuestionsAdmin(params);
      setQuestions(res.data?.data ?? res.data?.questions ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 });
    } catch {
      showToast('error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSubjects().then((res) => setSubjects(res.data?.data ?? res.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadQuestions(filters);
  }, [filters, loadQuestions]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setFilter('search', val), 400);
  };

  const loadTopics = async (subjectId) => {
    if (!subjectId) { setTopics([]); return; }
    try {
      const res = await getSubjectTopics(subjectId);
      setTopics(res.data?.data ?? res.data ?? []);
    } catch {}
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTopics([]);
    setModalOpen(true);
  };

  const openEdit = async (q) => {
    try {
      const res = await getQuestionAdmin(q.id);
      const data = res.data?.data ?? res.data;
      setForm({
        subject_id: data.subject_id ?? '',
        topic_id: data.topic_id ?? '',
        question_text: data.question_text ?? '',
        explanation: data.explanation ?? '',
        difficulty: data.difficulty ?? 'easy',
        question_type: data.question_type ?? 'single_choice',
        source_type: data.source_type ?? 'qbank',
        source_year: data.source_year ?? '',
        marks: data.marks ?? 1,
        negative_marks: data.negative_marks ?? 0,
        options: data.QuestionOptions?.map((o) => ({
          option_key: o.option_key,
          option_text: o.option_text,
          is_correct: o.is_correct,
        })) ?? EMPTY_FORM.options,
      });
      if (data.subject_id) loadTopics(data.subject_id);
      setEditingId(q.id);
      setModalOpen(true);
    } catch {
      showToast('error', 'Failed to load question');
    }
  };

  const saveQuestion = async () => {
    if (!form.question_text || !form.subject_id) {
      showToast('error', 'Subject and question text are required');
      return;
    }
    if (form.question_type === 'single_choice' && !form.options.some((o) => o.is_correct)) {
      showToast('error', 'Exactly one option must be marked correct');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.source_year) delete payload.source_year;
      if (!payload.topic_id) delete payload.topic_id;

      if (editingId) {
        await updateQuestion(editingId, payload);
      } else {
        await createQuestion(payload);
      }
      showToast('success', editingId ? 'Question updated' : 'Question created');
      setModalOpen(false);
      loadQuestions(filters);
    } catch {
      showToast('error', 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (q) => {
    const prev = q.is_active;
    setQuestions((qs) => qs.map((x) => x.id === q.id ? { ...x, is_active: !x.is_active } : x));
    try {
      await toggleQuestion(q.id);
    } catch {
      setQuestions((qs) => qs.map((x) => x.id === q.id ? { ...x, is_active: prev } : x));
      showToast('error', 'Toggle failed');
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQuestion(deleteTarget.id);
      showToast('success', 'Question deleted');
      loadQuestions(filters);
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <Toast toast={toast} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete Question?"
        message="This will permanently delete the question and all associated data."
      />

      {/* Question form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Question' : 'Create Question'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={saveQuestion}
              disabled={saving}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Question'}
            </button>
          </>
        }
      >
        <QuestionForm
          form={form}
          setForm={setForm}
          subjects={subjects}
          topics={topics}
          loadTopics={loadTopics}
        />
      </Modal>

      <div className="p-6 max-w-full mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Questions</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover"
          >
            <Plus className="w-4 h-4" /> Create Question
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Search questions…"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filters.subject_id}
            onChange={(e) => {
              setFilter('subject_id', e.target.value);
              setFilter('topic_id', '');
              loadTopics(e.target.value);
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filters.topic_id}
            onChange={(e) => setFilter('topic_id', e.target.value)}
            disabled={!filters.subject_id}
          >
            <option value="">All Topics</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filters.difficulty}
            onChange={(e) => setFilter('difficulty', e.target.value)}
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filters.source_type}
            onChange={(e) => setFilter('source_type', e.target.value)}
          >
            <option value="">All Sources</option>
            {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            value={filters.is_active}
            onChange={(e) => setFilter('is_active', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Question</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Active</th>
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
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No questions found.</td>
                </tr>
              ) : (
                questions.map((q, idx) => (
                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {(filters.page - 1) * 20 + idx + 1}
                    </td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <span className="line-clamp-2 text-slate-800">{q.question_text}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                      {q.subject?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {q.difficulty && <Badge color={q.difficulty}>{q.difficulty}</Badge>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {q.source_type && <Badge color={q.source_type}>{q.source_type.replace(/_/g, ' ')}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(q)}>
                        {q.is_active
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(q)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {(filters.page - 1) * 20 + 1}–{Math.min(filters.page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3">{filters.page} / {pagination.pages}</span>
              <button
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
