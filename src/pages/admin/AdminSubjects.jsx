import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from '@/api/adminService';
import { Plus, Pencil, Trash2, ChevronRight, Check, X } from 'lucide-react';

const toSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
      value ? 'bg-brand-blue' : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-4.5' : 'translate-x-1'
      }`}
    />
  </button>
);

const FormField = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
    {...props}
  />
);

const Textarea = (props) => (
  <textarea
    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
    rows={3}
    {...props}
  />
);

// ── Inline row editor ─────────────────────────────────────────────────────────
const InlineEdit = ({ value, onSave, onCancel }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <input
        className="flex-1 px-2 py-1 border border-brand-blue rounded text-sm focus:outline-none"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        autoFocus
      />
      <button onClick={() => onSave(val)} className="p-1 text-green-600 hover:text-green-700">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [subjectModal, setSubjectModal] = useState(false);
  const [topicModal, setTopicModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null); // { id, name }
  const [editingTopic, setEditingTopic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'subject'|'topic', id, name }

  const [subjectForm, setSubjectForm] = useState({ name: '', description: '' });
  const [topicForm, setTopicForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSubjects = useCallback(async () => {
    try {
      const res = await getSubjects();
      setSubjects(res.data?.data ?? res.data ?? []);
    } catch {
      showToast('error', 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const loadTopics = async (subject) => {
    setSelectedSubject(subject);
    setTopicsLoading(true);
    try {
      const res = await getSubjectTopics(subject.id);
      setTopics(res.data?.data ?? res.data ?? []);
    } catch {
      showToast('error', 'Failed to load topics');
    } finally {
      setTopicsLoading(false);
    }
  };

  // ── Subject CRUD ────────────────────────────────────────────────────────────
  const openAddSubject = () => {
    setSubjectForm({ name: '', description: '' });
    setSubjectModal(true);
  };

  const saveSubject = async () => {
    setSaving(true);
    try {
      await createSubject(subjectForm);
      showToast('success', 'Subject created');
      setSubjectModal(false);
      loadSubjects();
    } catch {
      showToast('error', 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const saveInlineSubject = async (id, name) => {
    try {
      await updateSubject(id, { name });
      showToast('success', 'Subject updated');
      setEditingSubject(null);
      loadSubjects();
    } catch {
      showToast('error', 'Failed to update subject');
    }
  };

  const toggleSubjectActive = async (subject) => {
    try {
      await updateSubject(subject.id, { is_active: !subject.is_active });
      loadSubjects();
    } catch {
      showToast('error', 'Failed to update');
    }
  };

  const confirmDeleteSubject = (s) =>
    setDeleteTarget({ type: 'subject', id: s.id, name: s.name });

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'subject') {
        await deleteSubject(deleteTarget.id);
        if (selectedSubject?.id === deleteTarget.id) {
          setSelectedSubject(null);
          setTopics([]);
        }
        loadSubjects();
      } else {
        await deleteTopic(deleteTarget.id);
        setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      showToast('success', `${deleteTarget.type === 'subject' ? 'Subject' : 'Topic'} deleted`);
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  // ── Topic CRUD ──────────────────────────────────────────────────────────────
  const openAddTopic = () => {
    setTopicForm({ name: '', description: '' });
    setTopicModal(true);
  };

  const saveTopic = async () => {
    setSaving(true);
    try {
      await createTopic({ ...topicForm, subject_id: selectedSubject.id });
      showToast('success', 'Topic created');
      setTopicModal(false);
      loadTopics(selectedSubject);
    } catch {
      showToast('error', 'Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  const saveInlineTopic = async (id, name) => {
    try {
      await updateTopic(id, { name });
      showToast('success', 'Topic updated');
      setEditingTopic(null);
      loadTopics(selectedSubject);
    } catch {
      showToast('error', 'Failed to update topic');
    }
  };

  const toggleTopicActive = async (topic) => {
    try {
      await updateTopic(topic.id, { is_active: !topic.is_active });
      loadTopics(selectedSubject);
    } catch {
      showToast('error', 'Failed to update');
    }
  };

  return (
    <AdminLayout>
      <Toast toast={toast} />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title={`Delete ${deleteTarget?.type === 'subject' ? 'Subject' : 'Topic'}?`}
        message={
          deleteTarget?.type === 'subject'
            ? `Deleting "${deleteTarget?.name}" will break any questions linked to this subject.`
            : `Delete topic "${deleteTarget?.name}"? This cannot be undone.`
        }
      />

      {/* Add Subject Modal */}
      <Modal
        open={subjectModal}
        onClose={() => setSubjectModal(false)}
        title="Add Subject"
        size="sm"
        footer={
          <>
            <button onClick={() => setSubjectModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={saveSubject}
              disabled={saving || !subjectForm.name}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create Subject'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name *">
            <Input
              value={subjectForm.name}
              onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Cardiology"
            />
            {subjectForm.name && (
              <p className="text-xs text-slate-400 mt-1">
                Slug: <code className="bg-slate-100 px-1 rounded">{toSlug(subjectForm.name)}</code>
              </p>
            )}
          </FormField>
          <FormField label="Description">
            <Textarea
              value={subjectForm.description}
              onChange={(e) => setSubjectForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </FormField>
        </div>
      </Modal>

      {/* Add Topic Modal */}
      <Modal
        open={topicModal}
        onClose={() => setTopicModal(false)}
        title={`Add Topic — ${selectedSubject?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setTopicModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={saveTopic}
              disabled={saving || !topicForm.name}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create Topic'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name *">
            <Input
              value={topicForm.name}
              onChange={(e) => setTopicForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Arrhythmias"
            />
            {topicForm.name && (
              <p className="text-xs text-slate-400 mt-1">
                Slug: <code className="bg-slate-100 px-1 rounded">{toSlug(topicForm.name)}</code>
              </p>
            )}
          </FormField>
          <FormField label="Description">
            <Textarea
              value={topicForm.description}
              onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </FormField>
        </div>
      </Modal>

      {/* Page content */}
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Subjects &amp; Topics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Subjects ── */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Subjects</h2>
              <button
                onClick={openAddSubject}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-center text-slate-400 py-16 text-sm">No subjects yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                      selectedSubject?.id === s.id ? 'bg-brand-blue/5' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => loadTopics(s)}
                  >
                    <div className="flex-1 min-w-0">
                      {editingSubject?.id === s.id ? (
                        <InlineEdit
                          value={s.name}
                          onSave={(v) => saveInlineSubject(s.id, v)}
                          onCancel={() => setEditingSubject(null)}
                        />
                      ) : (
                        <>
                          <div className="text-sm font-medium text-slate-800 truncate">{s.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {s.topics_count ?? s.topics?.length ?? 0} topics
                          </div>
                        </>
                      )}
                    </div>
                    <Toggle value={s.is_active} onChange={() => toggleSubjectActive(s)} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSubject(s); }}
                      className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmDeleteSubject(s); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Topics ── */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {selectedSubject ? `Topics — ${selectedSubject.name}` : 'Topics'}
              </h2>
              {selectedSubject && (
                <button
                  onClick={openAddTopic}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Topic
                </button>
              )}
            </div>

            {!selectedSubject ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ChevronRight className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Select a subject to view topics</p>
              </div>
            ) : topicsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : topics.length === 0 ? (
              <p className="text-center text-slate-400 py-16 text-sm">No topics yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {topics.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      {editingTopic?.id === t.id ? (
                        <InlineEdit
                          value={t.name}
                          onSave={(v) => saveInlineTopic(t.id, v)}
                          onCancel={() => setEditingTopic(null)}
                        />
                      ) : (
                        <div className="text-sm font-medium text-slate-800 truncate">{t.name}</div>
                      )}
                    </div>
                    <Toggle value={t.is_active} onChange={() => toggleTopicActive(t)} />
                    <button
                      onClick={() => setEditingTopic(t)}
                      className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'topic', id: t.id, name: t.name })}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
