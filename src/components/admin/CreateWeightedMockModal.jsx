import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { getWeightedMockPreview, createWeightedMock } from '@/api/adminService';

const DEFAULT_FORM = { title: '', question_count: 150, duration_minutes: 210 };
const MIN_QUESTIONS = 20;
const MAX_QUESTIONS = 300;

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent';

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

const UnassignedSubjectsNotice = ({ subjects }) => {
  if (!subjects?.length) return null;
  const shown = subjects.slice(0, 5).map((s) => `${s.name} (${s.question_count})`).join(', ');
  const more = subjects.length > 5 ? ` and ${subjects.length - 5} more` : '';
  return (
    <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <p>
        Left out because they have no exam domain: {shown}{more}.{' '}
        <Link to="/admin/subjects" className="font-medium underline">Assign them on Subjects &amp; Topics</Link>.
      </p>
    </div>
  );
};

const PreviewTable = ({ preview }) => {
  const shortDomains = preview.domains.filter((d) => d.unused_available < d.per_mock);
  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 border-b border-slate-200">
            <th className="text-left py-2 font-medium">Domain</th>
            <th className="text-right py-2 font-medium">In this mock</th>
            <th className="text-right py-2 font-medium">Unused questions left</th>
          </tr>
        </thead>
        <tbody>
          {preview.domains.map((d) => (
            <tr key={d.key} className="border-b border-slate-100">
              <td className="py-2 text-slate-700">{d.label} <span className="text-slate-400">({d.weight * 100}%)</span></td>
              <td className="py-2 text-right text-slate-700">{d.per_mock}</td>
              <td className={`py-2 text-right ${d.unused_available < d.per_mock ? 'text-amber-700 font-medium' : 'text-slate-700'}`}>
                {d.unused_available}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {shortDomains.length ? (
        <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {shortDomains.map((d) => d.label).join(', ')} {shortDomains.length === 1 ? 'has' : 'have'} run low, so this mock
            will reuse some questions from earlier mocks (the least-used ones first). Importing more questions fixes this.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          No repeats: enough unused questions for {preview.mocks_without_repeats} more mock
          {preview.mocks_without_repeats === 1 ? '' : 's'} of this size.
        </p>
      )}

      <UnassignedSubjectsNotice subjects={preview.unassigned_subjects} />
    </div>
  );
};

const CreatedSummary = ({ result }) => (
  <div className="space-y-4">
    <div className="flex gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
      <CheckCircle2 className="w-5 h-5 shrink-0" />
      <p>
        <strong>{result.mock_test.title}</strong> was created with {result.mock_test.total_questions} questions. It is{' '}
        <strong>not published</strong> yet: review it, then switch it on in the Actions column.
      </p>
    </div>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-slate-500 border-b border-slate-200">
          <th className="text-left py-2 font-medium">Domain</th>
          <th className="text-right py-2 font-medium">Questions</th>
          <th className="text-right py-2 font-medium">Reused from earlier mocks</th>
        </tr>
      </thead>
      <tbody>
        {result.domains.map((d) => (
          <tr key={d.key} className="border-b border-slate-100">
            <td className="py-2 text-slate-700">{d.label}</td>
            <td className="py-2 text-right text-slate-700">{d.count}</td>
            <td className={`py-2 text-right ${d.repeats ? 'text-amber-700 font-medium' : 'text-slate-700'}`}>{d.repeats}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <UnassignedSubjectsNotice subjects={result.unassigned_subjects} />
  </div>
);

export const CreateWeightedMockModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const questionCount = Number(form.question_count);
  const isQuestionCountValid =
    Number.isInteger(questionCount) && questionCount >= MIN_QUESTIONS && questionCount <= MAX_QUESTIONS;

  useEffect(() => {
    if (!open) return;
    setForm(DEFAULT_FORM);
    setPreview(null);
    setResult(null);
    setError('');
  }, [open]);

  // Debounced so typing "150" does not fetch for "1" and "15" first.
  useEffect(() => {
    if (!open || !isQuestionCountValid) return undefined;
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const res = await getWeightedMockPreview(questionCount);
        if (!isCancelled) { setPreview(res.data); setError(''); }
      } catch (err) {
        if (!isCancelled) setError(errorMessage(err, 'Could not load the question pool'));
      } finally {
        if (!isCancelled) setIsPreviewLoading(false);
      }
    }, 400);
    return () => { isCancelled = true; clearTimeout(timer); };
  }, [open, questionCount, isQuestionCountValid]);

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');
    try {
      const res = await createWeightedMock({
        title: form.title,
        question_count: questionCount,
        duration_minutes: Number(form.duration_minutes),
      });
      setResult(res.data);
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the mock'));
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = form.title.trim() && isQuestionCountValid && Number(form.duration_minutes) > 0 && !isCreating;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create AMC Mock"
      size="md"
      footer={
        result ? (
          <button onClick={onClose} className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover">
            Done
          </button>
        ) : (
          <>
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {isCreating ? 'Creating…' : 'Create Mock'}
            </button>
          </>
        )
      }
    >
      {result ? (
        <CreatedSummary result={result} />
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            Builds a fixed mock in the AMC weightage — Medicine 30%, Surgery 20%, and Women&apos;s, Child, Mental and
            Population Health &amp; Ethics 12.5% each — using recall questions not yet in any mock.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3 space-y-1">
              <label className="block text-sm font-medium text-slate-700">Title *</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. AMC Mock 4"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Questions</label>
              <input
                type="number"
                min={MIN_QUESTIONS}
                max={MAX_QUESTIONS}
                className={inputClass}
                value={form.question_count}
                onChange={(e) => setForm((f) => ({ ...f, question_count: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Duration (min)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
          </div>

          {!isQuestionCountValid ? (
            <p className="text-xs text-red-600">Questions must be a whole number from {MIN_QUESTIONS} to {MAX_QUESTIONS}.</p>
          ) : isPreviewLoading || (!preview && !error) ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : preview ? (
            <PreviewTable preview={preview} />
          ) : null}

          {error && <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
};
