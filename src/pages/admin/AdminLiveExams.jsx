import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Radio, Eye, EyeOff } from 'lucide-react';
import { AdminLayout, Toast, useAdminToast } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { getLiveExamsAdmin, createLiveExam } from '@/api/liveExamService';
import { getMockTests, getWeightedMockPreview } from '@/api/adminService';
import { fmtDateTime, errorMessage } from '@/components/liveExam/format';
import { PhaseBadge, toLocalInput, fromLocalInput, inputClass } from '@/components/liveExam/adminShared';

const defaultForm = () => {
  // Default: tomorrow 10:00–18:00 local time, which an admin then adjusts.
  const opens = new Date(); opens.setDate(opens.getDate() + 1); opens.setHours(10, 0, 0, 0);
  const closes = new Date(opens); closes.setHours(18, 0, 0, 0);
  return {
    title: '', description: '', instructions: '',
    opens_at: toLocalInput(opens), closes_at: toLocalInput(closes),
    paper: 'generate', question_count: 150, duration_minutes: 210, mock_test_id: '',
    pass_percent: '', leaderboard_size: 50, name_display: 'initials', release_as_mock: true,
  };
};

const CreateLiveExamModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(defaultForm);
  const [mocks, setMocks] = useState([]);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    setForm(defaultForm());
    setError('');
    getMockTests().then((res) => setMocks(res.data ?? [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || form.paper !== 'generate') return undefined;
    const count = Number(form.question_count);
    if (!Number.isInteger(count) || count < 20 || count > 300) { setPreview(null); return undefined; }
    const t = setTimeout(() => {
      getWeightedMockPreview(count).then((res) => setPreview(res.data)).catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(t);
  }, [open, form.paper, form.question_count]);

  // Any fixed mock (live-exam papers are not listed). The exam sits a copy, so
  // the original stays in Mock Exams exactly as it is.
  const eligibleMocks = mocks.filter((m) => m.test_type === 'fixed');
  const chosenMock = eligibleMocks.find((m) => String(m.id) === String(form.mock_test_id));
  const shortDomains = preview?.domains.filter((d) => d.total_available < d.per_mock) ?? [];

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        opens_at: fromLocalInput(form.opens_at),
        closes_at: fromLocalInput(form.closes_at),
        pass_percent: form.pass_percent === '' ? null : Number(form.pass_percent),
        leaderboard_size: Number(form.leaderboard_size),
        name_display: form.name_display,
        ...(form.paper === 'generate'
          ? {
              generate: { question_count: Number(form.question_count), duration_minutes: Number(form.duration_minutes) },
              release_as_mock: form.release_as_mock,
            }
          : { mock_test_id: Number(form.mock_test_id), release_as_mock: false }),
      };
      const res = await createLiveExam(body);
      onCreated(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the live exam'));
    } finally {
      setSaving(false);
    }
  };

  const canCreate = form.title.trim() && form.opens_at && form.closes_at && !saving &&
    (form.paper === 'generate' ? shortDomains.length === 0 : form.mock_test_id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New live exam"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleCreate} disabled={!canCreate} className="px-4 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50">
            {saving ? 'Creating…' : 'Create exam'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          It starts <strong>hidden from students</strong>. You switch it on from its page when you are ready.
        </p>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="e.g. AMC Catalyst Launch Exam — October 2026" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Short description</label>
          <textarea rows={2} className={inputClass} value={form.description} onChange={set('description')} placeholder="Shown on the exam page" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Opens *</label>
            <input type="datetime-local" className={inputClass} value={form.opens_at} onChange={set('opens_at')} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Closes *</label>
            <input type="datetime-local" className={inputClass} value={form.closes_at} onChange={set('closes_at')} />
          </div>
          <p className="sm:col-span-2 text-xs text-slate-500 -mt-2">
            Your timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Students can start any time in this window and
            get the full duration — but every attempt ends at closing time at the latest. For a common start time, set
            Closes = Opens + duration + a few minutes.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Paper *</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={form.paper === 'generate'} onChange={() => setForm((f) => ({ ...f, paper: 'generate' }))} /> Generate a new AMC-weighted paper</label>
            <label className="flex items-center gap-2"><input type="radio" checked={form.paper === 'existing'} onChange={() => setForm((f) => ({ ...f, paper: 'existing' }))} /> Use an existing mock</label>
          </div>
          {form.paper === 'generate' ? (
            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Questions</label>
                  <input type="number" min={20} max={300} className={inputClass} value={form.question_count} onChange={set('question_count')} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Duration (min)</label>
                  <input type="number" min={1} className={inputClass} value={form.duration_minutes} onChange={set('duration_minutes')} />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Same weightage as Create AMC Mock: Medicine 30%, Surgery 20%, Women&apos;s / Child / Mental / Population Health 12.5% each,
                using questions not yet in any mock first.
                {preview && shortDomains.length === 0 && <> Enough fresh questions for {preview.mocks_without_repeats} paper(s) with no repeats.</>}
              </p>
              {shortDomains.length > 0 && (
                <p className="text-xs text-red-600">Not enough questions in {shortDomains.map((d) => d.label).join(', ')}. Assign more subjects to domains or import more questions.</p>
              )}
              <label className="flex items-start gap-2 text-sm text-slate-700 pt-1">
                <input type="checkbox" className="mt-0.5" checked={form.release_as_mock} onChange={(e) => setForm((f) => ({ ...f, release_as_mock: e.target.checked }))} />
                <span>
                  Add this paper to Mock Exams after the exam
                  <span className="block text-xs text-slate-500">When you publish the results, a copy becomes a regular (paid) practice mock. You can change this later.</span>
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-1">
              <select className={inputClass} value={form.mock_test_id} onChange={set('mock_test_id')}>
                <option value="">Choose a fixed mock…</option>
                {eligibleMocks.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} — {m.total_questions} Qs, {m.duration_minutes} min{m.is_published ? ' (published)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                The live exam uses a copy of this mock, so the original stays in Mock Exams unchanged.
              </p>
              {chosenMock?.is_published && (
                <p className="text-xs text-amber-700">
                  This mock is published, so students may already have practised it and seen its answers.
                </p>
              )}
            </div>
          )}
        </div>

        <details className="rounded-lg border border-slate-200 p-3">
          <summary className="text-sm font-medium text-slate-700 cursor-pointer">Instructions & results settings (can be changed later)</summary>
          <div className="space-y-4 mt-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Extra instructions for students</label>
              <textarea rows={3} className={inputClass} value={form.instructions} onChange={set('instructions')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Pass mark % (optional)</label>
                <input type="number" min={0} max={100} className={inputClass} value={form.pass_percent} onChange={set('pass_percent')} placeholder="none" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Leaderboard size</label>
                <input type="number" min={0} max={500} className={inputClass} value={form.leaderboard_size} onChange={set('leaderboard_size')} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Names on leaderboard</label>
                <select className={inputClass} value={form.name_display} onChange={set('name_display')}>
                  <option value="initials">First name + initial</option>
                  <option value="full">Full name</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>
        </details>

        {error && <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
};

export const AdminLiveExams = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useAdminToast();
  const [exams, setExams] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    getLiveExamsAdmin()
      .then((res) => setExams(res.data ?? []))
      .catch((err) => { setExams([]); showToast('error', errorMessage(err, 'Could not load live exams')); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <Toast toast={toast} />
      <CreateLiveExamModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(exam) => { setCreating(false); navigate(`/admin/live-exams/${exam.id}`); }}
      />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Live Exams</h1>
            <p className="text-sm text-slate-500 mt-1">Scheduled, one-attempt exams for every student — results published later on the website.</p>
          </div>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white text-sm font-medium rounded-lg hover:bg-brand-blue-hover">
            <Plus className="w-4 h-4" /> New live exam
          </button>
        </div>

        {exams === null ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <Radio className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No live exams yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-medium px-4 py-3">Exam</th>
                  <th className="text-left font-medium px-4 py-3">Window</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Students</th>
                  <th className="text-right font-medium px-4 py-3">Started / Submitted</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/live-exams/${e.id}`} className="font-medium text-slate-900 hover:text-brand-blue">{e.title}</Link>
                      <p className="text-xs text-slate-400">{e.mock_test.total_questions} Qs · {e.mock_test.duration_minutes} min</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDateTime(e.opens_at)}<br />→ {fmtDateTime(e.closes_at)}</td>
                    <td className="px-4 py-3"><PhaseBadge phase={e.phase} /></td>
                    <td className="px-4 py-3">
                      {e.show_in_nav
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><Eye className="w-3.5 h-3.5" /> Visible</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><EyeOff className="w-3.5 h-3.5" /> Hidden</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{e.counts.started} / {e.counts.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
