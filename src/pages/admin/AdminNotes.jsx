import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ProtectedImage } from '@/components/ProtectedImage';
import {
  getNotesAdmin,
  uploadNote,
  updateNoteAdmin,
  deleteNoteAdmin,
  uploadNoteCoverImage,
  deleteNoteCoverImage,
} from '@/api/adminService';
import { Plus, Pencil, Trash2, FileText, UploadCloud, Image as ImageIcon, X } from 'lucide-react';

const COVER_MAX_BYTES = 5 * 1024 * 1024;

// ── Small shared bits (kept local, matching the other admin pages) ────────────

const FormField = ({ label, children, hint }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
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

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// Mirrors titleFromFilename() on the backend, so the prefilled title matches
// what the server would have derived if the field were left untouched.
const titleFromFilename = (name) =>
  name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const EMPTY_UPLOAD = { file: null, cover: null, title: '', description: '', sort_order: '' };

// ── Page ──────────────────────────────────────────────────────────────────────

export const AdminNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD);
  const [progress, setProgress] = useState(null);

  const [editing, setEditing] = useState(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotesAdmin();
      setNotes(res.data ?? []);
    } catch (err) {
      notify('error', errorMessage(err, 'Could not load notes'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const pickFile = (file) => {
    if (!file) return;
    setUploadForm((f) => ({
      ...f,
      file,
      // Only prefill an untouched title, so re-picking a file does not wipe
      // something the admin already typed.
      title: f.title || titleFromFilename(file.name),
    }));
  };

  const pickCover = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify('error', 'Cover must be an image file.');
    if (file.size > COVER_MAX_BYTES) return notify('error', 'Cover image must be smaller than 5MB.');
    setUploadForm((f) => ({ ...f, cover: file }));
  };

  const submitUpload = async () => {
    if (!uploadForm.file) return notify('error', 'Choose a PDF first');

    // Blank fields are omitted rather than sent empty. When this upload
    // replaces an existing note, the server only overwrites what it receives —
    // so leaving description untouched keeps the one already saved instead of
    // clearing it.
    const body = new FormData();
    body.append('file', uploadForm.file);
    if (uploadForm.title.trim()) body.append('title', uploadForm.title.trim());
    if (uploadForm.description.trim()) body.append('description', uploadForm.description.trim());
    if (uploadForm.sort_order !== '') body.append('sort_order', uploadForm.sort_order);

    setSaving(true);
    setProgress(0);
    try {
      const res = await uploadNote(body, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });

      // The cover is a separate request keyed on the note's id, so it only
      // goes out once the note itself exists. A failure here is reported on
      // its own and does not undo the note upload above — the PDF is what
      // has to succeed, the cover can always be added again from Edit.
      if (uploadForm.cover && res.data?.id) {
        const coverBody = new FormData();
        coverBody.append('cover', uploadForm.cover);
        try {
          await uploadNoteCoverImage(res.data.id, coverBody);
        } catch (err) {
          notify('error', errorMessage(err, 'Note uploaded, but the cover image failed'));
        }
      }

      // 201 = new note, 200 = a note with this filename already existed and was
      // replaced. Worth saying out loud, or a re-upload looks like it did nothing.
      notify(
        'success',
        res.status === 201 ? 'Note uploaded' : 'Existing note replaced with this file'
      );
      setUploadOpen(false);
      setUploadForm(EMPTY_UPLOAD);
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Upload failed'));
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  // ── Edit / delete ───────────────────────────────────────────────────────────

  const submitEdit = async () => {
    setSaving(true);
    try {
      await updateNoteAdmin(editing.id, {
        title: editing.title,
        description: editing.description,
        sort_order: Number(editing.sort_order) || 0,
        is_active: editing.is_active,
      });
      notify('success', 'Note updated');
      setEditing(null);
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not update note'));
    } finally {
      setSaving(false);
    }
  };

  // Cover changes apply immediately rather than waiting on Save — the note's
  // metadata and its cover are two independent things on the server (two
  // separate endpoints), so there's nothing for a combined "Save" to batch.
  const replaceEditCover = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify('error', 'Cover must be an image file.');
    if (file.size > COVER_MAX_BYTES) return notify('error', 'Cover image must be smaller than 5MB.');

    const body = new FormData();
    body.append('cover', file);
    setCoverBusy(true);
    try {
      await uploadNoteCoverImage(editing.id, body);
      setEditing((n) => ({ ...n, has_cover: true }));
      setNotes((all) => all.map((n) => (n.id === editing.id ? { ...n, has_cover: true } : n)));
      notify('success', 'Cover image updated');
    } catch (err) {
      notify('error', errorMessage(err, 'Could not update cover image'));
    } finally {
      setCoverBusy(false);
    }
  };

  const removeEditCover = async () => {
    setCoverBusy(true);
    try {
      await deleteNoteCoverImage(editing.id);
      setEditing((n) => ({ ...n, has_cover: false }));
      setNotes((all) => all.map((n) => (n.id === editing.id ? { ...n, has_cover: false } : n)));
      notify('success', 'Cover image removed');
    } catch (err) {
      notify('error', errorMessage(err, 'Could not remove cover image'));
    } finally {
      setCoverBusy(false);
    }
  };

  const toggleActive = async (note) => {
    try {
      await updateNoteAdmin(note.id, { is_active: !note.is_active });
      setNotes((all) =>
        all.map((n) => (n.id === note.id ? { ...n, is_active: !n.is_active } : n))
      );
    } catch (err) {
      notify('error', errorMessage(err, 'Could not change visibility'));
    }
  };

  const toggleFree = async (note) => {
    try {
      await updateNoteAdmin(note.id, { is_free: !note.is_free });
      setNotes((all) =>
        all.map((n) => (n.id === note.id ? { ...n, is_free: !n.is_free } : n))
      );
      notify(
        'success',
        note.is_free
          ? 'Now behind the paywall — only students with a Notes plan can open it'
          : 'Now a free sample — any signed-in student can read it'
      );
    } catch (err) {
      notify('error', errorMessage(err, 'Could not change access'));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteNoteAdmin(deleteTarget.id);
      notify('success', 'Note deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      notify('error', errorMessage(err, 'Could not delete note'));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
          <p className="text-sm text-slate-500 mt-1">
            PDFs shown to students on their Notes page. Uploads appear immediately and are
            paid by default — switch on "Free sample" to open one to everyone.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Upload note
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading notes…</div>
        ) : notes.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <FileText className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No notes yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload a PDF and it will show on the student Notes page straight away.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Title</th>
                  <th className="text-left font-medium px-5 py-3">Size</th>
                  <th className="text-left font-medium px-5 py-3">Pages</th>
                  <th className="text-left font-medium px-5 py-3">Order</th>
                  <th className="text-left font-medium px-5 py-3">Free sample</th>
                  <th className="text-left font-medium px-5 py-3">Visible</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{note.title}</p>
                      {note.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {note.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatSize(note.file_size_bytes)}</td>
                    <td className="px-5 py-3 text-slate-500">{note.page_count ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500 tabular-nums">{note.sort_order}</td>
                    {/* Free samples are readable without a plan. Everything else
                        sits behind the paywall, so this is the switch that
                        decides whether a note is product or marketing. */}
                    <td className="px-5 py-3">
                      <Toggle value={note.is_free} onChange={() => toggleFree(note)} />
                    </td>
                    <td className="px-5 py-3">
                      <Toggle value={note.is_active} onChange={() => toggleActive(note)} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setEditing({ ...note, description: note.description ?? '' })
                          }
                          className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-100 rounded-lg transition"
                          title="Edit details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(note)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Upload ─────────────────────────────────────────────────────────── */}
      <Modal
        open={uploadOpen}
        onClose={() => !saving && setUploadOpen(false)}
        title="Upload note"
        footer={
          <>
            <button
              onClick={() => setUploadOpen(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitUpload}
              disabled={saving || !uploadForm.file}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? `Uploading${progress !== null ? ` ${progress}%` : '…'}` : 'Upload'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer hover:border-brand-blue/50 hover:bg-slate-50 transition">
            <UploadCloud className="w-7 h-7 text-slate-300" />
            {uploadForm.file ? (
              <>
                <p className="text-sm font-medium text-slate-700">{uploadForm.file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(uploadForm.file.size)}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">Choose a PDF</p>
                <p className="text-xs text-slate-400">PDF, up to 10 MB</p>
              </>
            )}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>

          {progress !== null && (
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <FormField
            label="Cover image"
            hint="Optional. Shown as the thumbnail on the student Notes page."
          >
            <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-brand-blue/50 hover:bg-slate-50 transition">
              <ImageIcon className="w-5 h-5 text-slate-300 shrink-0" />
              {uploadForm.cover ? (
                <p className="text-sm font-medium text-slate-700 truncate">{uploadForm.cover.name}</p>
              ) : (
                <p className="text-sm text-slate-500">Choose an image (up to 5MB)</p>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickCover(e.target.files?.[0])}
              />
            </label>
          </FormField>

          <FormField label="Title">
            <Input
              value={uploadForm.title}
              onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Cardiology Basics"
            />
          </FormField>

          <FormField label="Description" hint="Optional. Shown under the title on the Notes page.">
            <Textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>

          <FormField label="Sort order" hint="Lower numbers appear first. Leave blank for 0.">
            <Input
              type="number"
              value={uploadForm.sort_order}
              onChange={(e) => setUploadForm((f) => ({ ...f, sort_order: e.target.value }))}
            />
          </FormField>

          <p className="text-xs text-slate-400">
            Uploading a file with the same filename replaces that note rather than adding a
            second copy.
          </p>
        </div>
      </Modal>

      {/* ── Edit ───────────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title="Edit note"
        footer={
          <>
            <button
              onClick={() => setEditing(null)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitEdit}
              disabled={saving}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <FormField label="Cover image" hint="Shown as the thumbnail on the student Notes page.">
              <div className="flex items-center gap-3">
                {editing.has_cover ? (
                  <ProtectedImage
                    src={`/api/notes/${editing.id}/cover`}
                    alt={editing.title}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <label className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  {coverBusy ? 'Uploading…' : editing.has_cover ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={coverBusy}
                    onChange={(e) => replaceEditCover(e.target.files?.[0])}
                  />
                </label>
                {editing.has_cover && (
                  <button
                    type="button"
                    onClick={removeEditCover}
                    disabled={coverBusy}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Remove cover image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </FormField>

            <FormField label="Title">
              <Input
                value={editing.title}
                onChange={(e) => setEditing((n) => ({ ...n, title: e.target.value }))}
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing((n) => ({ ...n, description: e.target.value }))}
              />
            </FormField>

            <FormField label="Sort order" hint="Lower numbers appear first.">
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(e) => setEditing((n) => ({ ...n, sort_order: e.target.value }))}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Visible to students</p>
                <p className="text-xs text-slate-400">Hidden notes stay uploaded but are not listed.</p>
              </div>
              <Toggle
                value={editing.is_active}
                onChange={(v) => setEditing((n) => ({ ...n, is_active: v }))}
              />
            </div>

            <p className="text-xs text-slate-400">
              To replace the PDF itself, upload a file with the same filename.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete note"
        message={`"${deleteTarget?.title}" will be removed from the Notes page and the PDF deleted from storage. This cannot be undone.`}
      />
    </AdminLayout>
  );
};
