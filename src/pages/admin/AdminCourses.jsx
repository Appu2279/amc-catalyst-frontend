import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  getFeatures, createFeature, getBenefits, createBenefit,
} from '@/api/adminService';
import { cn } from '@/utils/cn';
import { CheckCircle, Pencil, Plus, Star, Tag, Trash2, X } from 'lucide-react';

// ── Shared form atoms ─────────────────────────────────────────────────────────
const FInput = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <input
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  </div>
);

const FTextarea = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <textarea
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        value ? 'bg-blue-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-4' : 'translate-x-1'
        )}
      />
    </button>
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-60 px-4 py-3 rounded-lg shadow-lg text-sm font-medium',
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      )}
    >
      {toast.message}
    </div>
  );
};

// ── MultiSelectCreate ─────────────────────────────────────────────────────────
// allOptions: [{id, label}], selectedIds: number[]
// onChange: (ids: number[]) => void
// onCreate: async (text: string) => {id, label} | null
const MultiSelectCreate = ({ label, allOptions, selectedIds, onChange, onCreate }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = allOptions.filter((o) => selectedIds.includes(o.id));
  const q = query.toLowerCase();
  const filtered = allOptions.filter(
    (o) => !selectedIds.includes(o.id) && o.label.toLowerCase().includes(q)
  );
  const exactMatch = allOptions.some((o) => o.label.toLowerCase() === q);
  const showCreate = query.trim().length > 0 && !exactMatch;

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const item = await onCreate(query.trim());
      if (item) {
        onChange([...selectedIds, item.id]);
        setQuery('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1 relative" ref={ref}>
      {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
      <div
        className={cn(
          'min-h-10 w-full px-3 py-2 border rounded-lg bg-white cursor-text',
          open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300'
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {selected.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
            >
              {o.label}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(o.id); }}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            className="flex-1 min-w-24 outline-none text-sm bg-transparent"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? 'Search or create…' : ''}
          />
        </div>
      </div>
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { toggle(o.id); setQuery(''); setOpen(false); }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 text-slate-700"
            >
              {o.label}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 font-medium border-t border-slate-100 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              {creating ? 'Creating…' : 'Create "' + query.trim() + '"'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_COURSE = {
  title: '',
  description: '',
  duration_months: 1,
  is_active: true,
  pricing: [{ actual_price: '', discounted_price: '', is_early_bird: false }],
  feature_ids: [],
  benefit_ids: [],
};

// ── Course Form ───────────────────────────────────────────────────────────────
const CourseForm = ({ form, setForm, allFeatures, allBenefits, onCreateFeature, onCreateBenefit }) => {
  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const updatePricing = (i, key, val) =>
    setForm((p) => {
      const pricing = [...p.pricing];
      pricing[i] = { ...pricing[i], [key]: val };
      return { ...p, pricing };
    });
  const addPricing = () =>
    setForm((p) => ({
      ...p,
      pricing: [...p.pricing, { actual_price: '', discounted_price: '', is_early_bird: false }],
    }));
  const removePricing = (i) =>
    setForm((p) => ({ ...p, pricing: p.pricing.filter((_, idx) => idx !== i) }));

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
            placeholder="3"
          />
          <FToggle label="Active" value={form.is_active} onChange={(v) => update('is_active', v)} />
        </div>
      </div>

      {/* Pricing tiers */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">
          Pricing Tiers
        </h3>
        {form.pricing.map((p, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tier {i + 1}</span>
              <div className="flex items-center gap-4">
                <FToggle
                  label="Early Bird"
                  value={p.is_early_bird}
                  onChange={(v) => updatePricing(i, 'is_early_bird', v)}
                />
                {form.pricing.length > 1 && (
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
                label="Actual Price (Rs)"
                type="number"
                min={0}
                value={p.actual_price}
                onChange={(e) => updatePricing(i, 'actual_price', e.target.value)}
                placeholder="5499"
              />
              <FInput
                label="Discounted Price (Rs)"
                type="number"
                min={0}
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
          className="text-xs text-blue-600 hover:underline"
        >
          + Add Pricing Tier
        </button>
      </div>

      {/* Features */}
      <MultiSelectCreate
        label="Features"
        allOptions={allFeatures}
        selectedIds={form.feature_ids}
        onChange={(ids) => update('feature_ids', ids)}
        onCreate={onCreateFeature}
      />

      {/* Benefits */}
      <MultiSelectCreate
        label="Benefits"
        allOptions={allBenefits}
        selectedIds={form.benefit_ids}
        onChange={(ids) => update('benefit_ids', ids)}
        onCreate={onCreateBenefit}
      />
    </div>
  );
};

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, onEdit, onDelete }) => {
  const pricings = course.CoursePricings ?? [];
  const features = course.Features ?? [];
  const benefits = course.Benefits ?? [];



  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full font-medium',
                course.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {course.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {course.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          )}
          {course.duration_months && (
            <p className="text-xs text-slate-400 mt-1">
              {course.duration_months} month{course.duration_months !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
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
            const hasDiscount = Number(tier.discounted_price) < Number(tier.actual_price);
            return (
              <div
                key={i}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  tier.is_early_bird
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                )}
              >
                <div className="flex items-center gap-1">
                  {tier.is_early_bird && (
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  )}
                  <span className="text-xs font-medium">
                    {tier.is_early_bird ? 'Early Bird' : 'Standard'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-bold">
                    Rs {Number(tier.discounted_price ?? tier.actual_price).toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs line-through text-slate-400">
                      Rs {Number(tier.actual_price).toLocaleString()}
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
          {features.slice(0, 3).map((f, fi) => (
            <li key={f.id ?? fi} className="flex items-center gap-2 text-xs text-slate-600">
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
        {pricings.length > 0 && (
          <span className="ml-auto font-semibold text-slate-600">
            From Rs {Number(
              Math.min(...pricings.map((p) => Number(p.discounted_price ?? p.actual_price)))
            ).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [allBenefits, setAllBenefits] = useState([]);
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
    setLoading(true);
    try {
      const [coursesRes, featuresRes, benefitsRes] = await Promise.all([
        getCourses(),
        getFeatures(),
        getBenefits(),
      ]);
      setCourses(coursesRes.data?.data ?? coursesRes.data ?? []);
      const fList = featuresRes.data?.data ?? featuresRes.data ?? [];
      const bList = benefitsRes.data?.data ?? benefitsRes.data ?? [];
      setAllFeatures(fList.map((f) => ({ id: f.id, label: f.name })));
      setAllBenefits(bList.map((b) => ({ id: b.id, label: b.title ?? b.description ?? '' })));
    } catch {
      showToast('error', 'Failed to load data');
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
      pricing: course.CoursePricings?.length
        ? course.CoursePricings.map((p) => ({
            actual_price: p.actual_price ?? '',
            discounted_price: p.discounted_price ?? '',
            is_early_bird: p.is_early_bird ?? false,
          }))
        : [{ actual_price: '', discounted_price: '', is_early_bird: false }],
      feature_ids: course.Features?.map((f) => f.id) ?? [],
      benefit_ids: course.Benefits?.map((b) => b.id) ?? [],
    });
    setModalOpen(true);
  };

  const handleCreateFeature = async (name) => {
    try {
      const res = await createFeature({ name });
      const newF = res.data?.data ?? res.data;
      const item = { id: newF.id, label: newF.name };
      setAllFeatures((prev) => [...prev, item]);
      return item;
    } catch {
      showToast('error', 'Failed to create feature');
      return null;
    }
  };

  const handleCreateBenefit = async (title) => {
    try {
      const res = await createBenefit({ title });
      const newB = res.data?.data ?? res.data;
      const item = { id: newB.id, label: newB.title ?? newB.description ?? title };
      setAllBenefits((prev) => [...prev, item]);
      return item;
    } catch {
      showToast('error', 'Failed to create benefit');
      return null;
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('error', 'Course title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        duration_months: Number(form.duration_months),
        is_active: form.is_active,
        pricing: form.pricing
          .filter((p) => p.actual_price || p.discounted_price)
          .map((p) => ({
            actual_price: Number(p.actual_price),
            discounted_price: Number(p.discounted_price || p.actual_price),
            is_early_bird: p.is_early_bird,
          })),
        feature_ids: form.feature_ids,
        benefit_ids: form.benefit_ids,
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
      setDeleteTarget(null);
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
        message={'Delete "' + (deleteTarget?.title ?? '') + '"? This cannot be undone.'}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit — ' + editTarget.title : 'Create Course'}
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
              disabled={saving || !form.title.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Course'}
            </button>
          </>
        }
      >
        <CourseForm
          form={form}
          setForm={setForm}
          allFeatures={allFeatures}
          allBenefits={allBenefits}
          onCreateFeature={handleCreateFeature}
          onCreateBenefit={handleCreateBenefit}
        />
      </Modal>

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Courses</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
