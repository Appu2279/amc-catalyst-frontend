import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/api/adminService';
import { Plus, Pencil, Trash2, Star, CheckCircle, Tag } from 'lucide-react';

// ── Form helpers ──────────────────────────────────────────────────────────────
const FInput = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <input
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      {...props}
    />
  </div>
);

const FTextarea = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <textarea
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      rows={3}
      {...props}
    />
  </div>
);

const FToggle = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ₹{
        value ? 'bg-brand-blue' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ₹{
          value ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ₹{
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
};

// ── Empty form matching actual API shape ──────────────────────────────────────
const EMPTY_COURSE = {
  title: '',
  description: '',
  duration_months: 1,
  is_active: true,
  pricings: [{ actual_price: '', discounted_price: '', is_early_bird: false }],
  features: [{ name: '' }],
  benefits: [{ title: '' }],
};

// ── Course Form ───────────────────────────────────────────────────────────────
const CourseForm = ({ form, setForm }) => {
  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Pricings
  const updatePricing = (i, key, val) =>
    setForm((p) => {
      const pricings = [...p.pricings];
      pricings[i] = { ...pricings[i], [key]: val };
      return { ...p, pricings };
    });
  const addPricing = () =>
    setForm((p) => ({
      ...p,
      pricings: [...p.pricings, { actual_price: '', discounted_price: '', is_early_bird: false }],
    }));
  const removePricing = (i) =>
    setForm((p) => ({ ...p, pricings: p.pricings.filter((_, idx) => idx !== i) }));

  // Generic list helpers
  const updateList = (key, i, field, val) =>
    setForm((p) => {
      const arr = [...p[key]];
      arr[i] = { ...arr[i], [field]: val };
      return { ...p, [key]: arr };
    });
  const addListItem = (key, empty) =>
    setForm((p) => ({ ...p, [key]: [...p[key], empty] }));
  const removeListItem = (key, i) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
          Basic Info
        </h3>
        <FInput
          label="Course Title *"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. QBank + Recall Plan"
        />
        <FTextarea
          label="Description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Short description of this plan"
        />
        <div className="grid grid-cols-2 gap-4 items-end">
          <FInput
            label="Duration (months)"
            type="number"
            min={1}
            value={form.duration_months}
            onChange={(e) => update('duration_months', e.target.value)}
          />
          <FToggle
            label="Active"
            value={form.is_active}
            onChange={(v) => update('is_active', v)}
          />
        </div>
      </div>

      {/* Pricing tiers */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">
          Pricing
        </h3>
        {form.pricings.map((p, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pricing Tier {i + 1}</span>
              <div className="flex items-center gap-4">
                <FToggle
                  label="Early Bird"
                  value={p.is_early_bird}
                  onChange={(v) => updatePricing(i, 'is_early_bird', v)}
                />
                {form.pricings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePricing(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FInput
                label="Actual Price (₹)"
                type="number"
                min={0}
                step={0.01}
                value={p.actual_price}
                onChange={(e) => updatePricing(i, 'actual_price', e.target.value)}
                placeholder="5499"
              />
              <FInput
                label="Discounted Price (₹)"
                type="number"
                min={0}
                step={0.01}
                value={p.discounted_price}
                onChange={(e) => updatePricing(i, 'discounted_price', e.target.value)}
                placeholder="4999"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addPricing}
          className="text-xs text-brand-blue hover:underline"
        >
          + Add Pricing Tier
        </button>
      </div>

      {/* Features */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Features</h3>
          <button
            type="button"
            onClick={() => addListItem('features', { name: '' })}
            className="text-xs text-brand-blue hover:underline"
          >
            + Add Feature
          </button>
        </div>
        <div className="space-y-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                value={f.name}
                onChange={(e) => updateList('features', i, 'name', e.target.value)}
                placeholder={`Feature ${i + 1}`}
              />
              {form.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('features', i)}
                  className="text-slate-300 hover:text-red-500 text-lg leading-none shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Benefits</h3>
          <button
            type="button"
            onClick={() => addListItem('benefits', { title: '' })}
            className="text-xs text-brand-blue hover:underline"
          >
            + Add Benefit
          </button>
        </div>
        <div className="space-y-2">
          {form.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                value={b.title}
                onChange={(e) => updateList('benefits', i, 'title', e.target.value)}
                placeholder={`Benefit ${i + 1}`}
              />
              {form.benefits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('benefits', i)}
                  className="text-slate-300 hover:text-red-500 text-lg leading-none shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, onEdit, onDelete }) => {
  const pricings = course.CoursePricings ?? [];
  const features = course.Features ?? [];
  const benefits = course.Benefits ?? [];

  const lowestPrice = pricings.length
    ? Math.min(...pricings.map((p) => Number(p.discounted_price ?? p.actual_price)))
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
            {course.is_active ? (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full font-medium">
                Inactive
              </span>
            )}
          </div>
          {course.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">{course.duration_months} month{course.duration_months !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 text-slate-400 hover:text-brand-blue transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(course)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pricing tiers */}
      {pricings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pricings.map((tier, i) => {
            const hasDiscount =
              Number(tier.discounted_price) < Number(tier.actual_price);
            return (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg border text-sm ₹{
                  tier.is_early_bird
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  {tier.is_early_bird && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                  <span className="text-xs font-medium">
                    {tier.is_early_bird ? 'Early Bird' : 'Standard'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-bold">₹{Number(tier.discounted_price).toLocaleString()}</span>
                  {hasDiscount && (
                    <span className="text-xs line-through text-slate-400">
                      ₹{Number(tier.actual_price).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Features preview */}
      {features.length > 0 && (
        <ul className="space-y-1">
          {features.slice(0, 3).map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {f.name}
            </li>
          ))}
          {features.length > 3 && (
            <li className="text-xs text-slate-400 pl-5">+{features.length - 3} more</li>
          )}
        </ul>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> {features.length} features
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> {benefits.length} benefits
        </span>
        {lowestPrice !== null && (
          <span className="ml-auto font-semibold text-slate-600">
            From ₹{Number(lowestPrice).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const res = await getCourses();
      setCourses(res.data?.data ?? res.data ?? []);
    } catch {
      showToast('error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_COURSE);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditTarget(course);
    setForm({
      title: course.title ?? '',
      description: course.description ?? '',
      duration_months: course.duration_months ?? 1,
      is_active: course.is_active ?? true,
      pricings: course.CoursePricings?.length
        ? course.CoursePricings.map((p) => ({
            actual_price: p.actual_price ?? '',
            discounted_price: p.discounted_price ?? '',
            is_early_bird: p.is_early_bird ?? false,
          }))
        : [{ actual_price: '', discounted_price: '', is_early_bird: false }],
      features: course.Features?.length
        ? course.Features.map((f) => ({ name: f.name ?? '' }))
        : [{ name: '' }],
      benefits: course.Benefits?.length
        ? course.Benefits.map((b) => ({ title: b.title ?? '' }))
        : [{ title: '' }],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { showToast('error', 'Course title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        duration_months: Number(form.duration_months),
        is_active: form.is_active,
        pricings: form.pricings.map((p) => ({
          actual_price: Number(p.actual_price),
          discounted_price: Number(p.discounted_price),
          is_early_bird: p.is_early_bird,
        })),
        features: form.features.filter((f) => f.name).map((f) => ({ name: f.name })),
        benefits: form.benefits.filter((b) => b.title).map((b) => ({ title: b.title })),
      };

      if (editTarget) {
        await updateCourse(editTarget.id, payload);
      } else {
        await createCourse(payload);
      }
      showToast('success', editTarget ? 'Course updated' : 'Course created');
      setModalOpen(false);
      load();
    } catch {
      showToast('error', 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      showToast('success', 'Course deleted');
      load();
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
        title="Delete Course?"
        message={`Delete "₹{deleteTarget?.title}"? This cannot be undone.`}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit — ${editTarget.title}` : 'Create Course'}
        size="md"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Course'}
            </button>
          </>
        }
      >
        <CourseForm form={form} setForm={setForm} />
      </Modal>

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Courses</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-sm">No courses yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
