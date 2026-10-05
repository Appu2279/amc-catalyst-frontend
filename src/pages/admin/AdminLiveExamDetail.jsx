import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Download, ExternalLink, RotateCcw, Trash2, Play, Square, Search, Check, FileText, ChevronRight,
} from 'lucide-react';
import { AdminLayout, Toast, useAdminToast } from '@/components/layout/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getLiveExamAdmin, updateLiveExam, deleteLiveExam, setLiveExamVisibility, publishLiveExamResults,
  unpublishLiveExamResults, getLiveExamResults, getLiveExamResultsCsv, getLiveExamQuestionStats,
  getLiveExamAttemptDetail, resetLiveExamAttempt, releaseLiveExamPaper, getLiveExamPaperPdf,
} from '@/api/liveExamService';
import { StatTile, ScoreDistribution, DomainBars, ReviewList } from '@/components/liveExam/ResultParts';
import { PhaseBadge, toLocalInput, fromLocalInput, inputClass } from '@/components/liveExam/adminShared';
import { fmtDateTime, fmtDuration, errorMessage } from '@/components/liveExam/format';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'candidates', label: 'Candidates' },
  { key: 'questions', label: 'Questions' },
];

const STEPS = [
  { key: 'created', label: 'Paper ready' },
  { key: 'visible', label: 'Visible to students' },
  { key: 'open', label: 'Exam open' },
  { key: 'closed', label: 'Closed' },
  { key: 'results', label: 'Results published' },
];

const Lifecycle = ({ exam }) => {
  const done = {
    created: true,
    visible: exam.show_in_nav || exam.phase !== 'upcoming',
    open: exam.phase !== 'upcoming',
    closed: exam.phase === 'closed' || exam.phase === 'results',
    results: exam.phase === 'results',
  };
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((s, i) => (
        <li key={s.key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${done[s.key] ? 'bg-green-50 border-green-200 text-green-800' : 'border-slate-200 text-slate-400'}`}>
          {done[s.key] ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">{i + 1}</span>} {s.label}
        </li>
      ))}
    </ol>
  );
};

const Section = ({ title, children, action }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const Toggle = ({ on, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? 'bg-green-500' : 'bg-slate-300'}`}
    aria-pressed={on}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
);

// ── Overview ──────────────────────────────────────────────────────────────────

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const OverviewTab = ({ exam, onChange, showToast, confirm }) => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null); // 'paper' | 'answers'

  const downloadPaper = async (withAnswers) => {
    setDownloading(withAnswers ? 'answers' : 'paper');
    try {
      const res = await getLiveExamPaperPdf(exam.id, withAnswers);
      saveBlob(res.data, `${exam.slug}-paper${withAnswers ? '-with-answers' : ''}.pdf`);
    } catch (err) {
      // A failed blob request carries its JSON error as a Blob.
      const text = await err.response?.data?.text?.().catch(() => null);
      let message = 'Could not create the PDF';
      try { message = JSON.parse(text).message || message; } catch { /* not JSON */ }
      showToast('error', message);
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    setForm({
      title: exam.title, slug: exam.slug, description: exam.description ?? '', instructions: exam.instructions ?? '',
      opens_at: toLocalInput(exam.opens_at), closes_at: toLocalInput(exam.closes_at),
      pass_percent: exam.pass_percent ?? '', leaderboard_size: exam.leaderboard_size,
      name_display: exam.name_display, allow_answer_review: exam.allow_answer_review,
    });
  }, [exam]);

  if (!form) return null;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (patch, success = 'Saved') => {
    setSaving(true);
    try {
      onChange((await updateLiveExam(exam.id, patch)).data);
      showToast('success', success);
    } catch (err) {
      showToast('error', errorMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const action = async (fn, success) => {
    try { onChange((await fn()).data); showToast('success', success); }
    catch (err) { showToast('error', errorMessage(err, 'Something went wrong')); }
  };

  const publicUrl = `${window.location.origin}/results/${exam.slug}`;
  const running = exam.counts.in_progress;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Students">
        <div className="flex items-start gap-4">
          <Toggle on={exam.show_in_nav} onChange={(on) => action(() => setLiveExamVisibility(exam.id, on), on ? 'Now visible to students' : 'Hidden from students')} />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">{exam.show_in_nav ? 'Visible in the student dashboard' : 'Hidden from students'}</p>
            <p className="mt-1">
              On: every signed-in student sees a <strong>Live Exam</strong> item in the dashboard menu (with a countdown before it opens).
              Off: the item disappears. Keep it on after publishing so students can see their personal result there.
              Only one live exam can be on at a time.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Started" value={exam.counts.started} />
          <StatTile label="In progress" value={exam.counts.in_progress} />
          <StatTile label="Submitted" value={exam.counts.submitted} />
        </div>
        {exam.admin_test_attempts > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            + {exam.admin_test_attempts} admin test attempt(s), never counted in results. Reset them from the Candidates tab
            (filter: Admin tests) to rehearse again.
          </p>
        )}
      </Section>

      <Section title="Schedule">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Opens</label>
            <input type="datetime-local" className={inputClass} value={form.opens_at} onChange={set('opens_at')} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Closes</label>
            <input type="datetime-local" className={inputClass} value={form.closes_at} onChange={set('closes_at')} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {exam.mock_test.duration_minutes} min per attempt; attempts end at closing time at the latest.
          Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            disabled={saving}
            onClick={() => save({ opens_at: fromLocalInput(form.opens_at), closes_at: fromLocalInput(form.closes_at) }, 'Schedule saved')}
            className="px-3 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover disabled:opacity-50"
          >
            Save schedule
          </button>
          {exam.phase === 'upcoming' && (
            <button
              onClick={() => confirm({
                title: 'Open the exam now?',
                message: exam.show_in_nav ? 'Students can start immediately.' : 'It is still hidden — switch on "Students" too, or nobody can start.',
                confirmLabel: 'Open now', confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
                onConfirm: () => save({ opens_at: new Date().toISOString() }, 'Exam opened'),
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
            >
              <Play className="w-3.5 h-3.5" /> Open now
            </button>
          )}
          {exam.phase === 'open' && (
            <button
              onClick={() => confirm({
                title: 'Close the exam now?',
                message: running
                  ? `${running} student(s) are mid-exam. Their attempts end now and are marked with the answers saved so far.`
                  : 'No one can start after this.',
                confirmLabel: 'Close now',
                onConfirm: () => save({ closes_at: new Date().toISOString() }, 'Exam closed'),
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <Square className="w-3.5 h-3.5" /> Close now
            </button>
          )}
        </div>
      </Section>

      <Section title="Paper">
        <Link
          to={`/admin/mock-tests/${exam.mock_test.id}`}
          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-blue hover:bg-blue-50/40 transition-colors"
        >
          <FileText className="w-5 h-5 text-brand-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{exam.mock_test.title}</p>
            <p className="text-xs text-slate-500">
              {exam.mock_test.total_questions} questions · {exam.mock_test.total_marks} marks · {exam.mock_test.duration_minutes} min — view questions
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
        <p className="text-xs text-slate-500 mt-2">This paper belongs to the live exam only; it is not listed under Mock Tests.</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => downloadPaper(false)}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {downloading === 'paper' ? 'Preparing PDF…' : 'Questions PDF'}
          </button>
          <button
            onClick={() => downloadPaper(true)}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {downloading === 'answers' ? 'Preparing PDF…' : 'PDF with answers'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Includes figures. The first download can take up to a minute.</p>

        <div className="mt-4 pt-4 border-t border-slate-100">
          {exam.released_mock_test ? (
            <p className="text-sm text-slate-700">
              Added to Mock Exams as{' '}
              <Link to={`/admin/mock-tests/${exam.released_mock_test.id}`} className="text-brand-blue hover:underline">{exam.released_mock_test.title}</Link>
              {exam.released_mock_test.is_published ? ' (published).' : ' (currently unpublished).'}
            </p>
          ) : (
            <>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={exam.release_as_mock}
                  disabled={saving}
                  onChange={(e) => save({ release_as_mock: e.target.checked }, e.target.checked ? 'Will be added to Mock Exams' : 'Will not be added to Mock Exams')}
                />
                <span>
                  Add this paper to Mock Exams after the exam
                  <span className="block text-xs text-slate-500">
                    A copy becomes a published practice mock when you publish the results. Practice attempts on it are kept apart from the live exam.
                  </span>
                </span>
              </label>
              {(exam.phase === 'closed' || exam.phase === 'results') && (
                <button
                  onClick={() => confirm({
                    title: 'Add to Mock Exams now?',
                    message: exam.phase === 'closed'
                      ? 'A published copy appears in Mock Exams straight away. Students who practise it will see the answers — before you have published the results.'
                      : 'A published copy appears in Mock Exams straight away.',
                    confirmLabel: 'Add now', confirmClass: 'bg-brand-blue hover:bg-brand-blue-hover text-white',
                    onConfirm: () => action(() => releaseLiveExamPaper(exam.id), 'Added to Mock Exams'),
                  })}
                  className="mt-3 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Add to Mock Exams now
                </button>
              )}
            </>
          )}
        </div>
      </Section>

      <Section
        title="Results"
        action={exam.phase === 'results' && exam.public_results && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand-blue hover:underline">
            Public page <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      >
        {exam.phase === 'results' ? (
          <p className="text-sm text-slate-600">
            Published {fmtDateTime(exam.results_published_at)}.
            {exam.public_results
              ? <> Public page: <span className="font-mono text-xs break-all">{publicUrl}</span></>
              : ' The public page is switched off — students see only their own result.'}
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Nothing is shown to students until you publish. {exam.phase === 'closed'
              ? 'The exam is closed — check the Candidates tab, then publish.'
              : 'You can publish once the exam has closed.'}
          </p>
        )}
        <div className="flex items-start gap-4 mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <Toggle
            on={exam.public_results}
            disabled={saving}
            onChange={(on) => save({ public_results: on }, on ? 'Public results page on' : 'Public results page hidden')}
          />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">Public results page {exam.public_results ? 'on' : 'off'}</p>
            <p className="mt-0.5 text-xs">
              Off hides the results page and leaderboard from the website — even typing the address shows "not available".
              Students still see their own result in the dashboard once published.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Pass mark %</label>
            <input type="number" min={0} max={100} className={inputClass} value={form.pass_percent} onChange={set('pass_percent')} placeholder="none" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Leaderboard size</label>
            <input type="number" min={0} max={500} className={inputClass} value={form.leaderboard_size} onChange={set('leaderboard_size')} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Names shown</label>
            <select className={inputClass} value={form.name_display} onChange={set('name_display')}>
              <option value="initials">First name + initial</option>
              <option value="full">Full name</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 mt-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={form.allow_answer_review} onChange={(e) => setForm((f) => ({ ...f, allow_answer_review: e.target.checked }))} />
          Let students review every question with the correct answer and explanation (after publishing)
        </label>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            disabled={saving}
            onClick={() => save({
              pass_percent: form.pass_percent === '' ? null : Number(form.pass_percent),
              leaderboard_size: Number(form.leaderboard_size),
              name_display: form.name_display,
              allow_answer_review: form.allow_answer_review,
            }, 'Results settings saved')}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Save settings
          </button>
          {exam.phase === 'closed' && (
            <button
              onClick={() => confirm({
                title: 'Publish results?',
                message: 'The results page goes public on the website and every candidate can see their own result. Save any settings changes first.',
                confirmLabel: 'Publish', confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
                onConfirm: () => action(() => publishLiveExamResults(exam.id), 'Results published'),
              })}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Publish results
            </button>
          )}
          {exam.phase === 'results' && (
            <button
              onClick={() => confirm({
                title: 'Unpublish results?',
                message: 'The public page and every student result disappear until you publish again.',
                confirmLabel: 'Unpublish',
                onConfirm: () => action(() => unpublishLiveExamResults(exam.id), 'Results unpublished'),
              })}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              Unpublish
            </button>
          )}
        </div>
      </Section>

      <Section title="Details">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Title</label>
            <input className={inputClass} value={form.title} onChange={set('title')} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Results address</label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-400 shrink-0">/results/</span>
              <input className={inputClass} value={form.slug} onChange={set('slug')} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Description</label>
            <textarea rows={2} className={inputClass} value={form.description} onChange={set('description')} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Extra instructions</label>
            <textarea rows={3} className={inputClass} value={form.instructions} onChange={set('instructions')} />
          </div>
          <button
            disabled={saving}
            onClick={() => save({ title: form.title, slug: form.slug, description: form.description, instructions: form.instructions }, 'Details saved')}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Save details
          </button>
        </div>
      </Section>
    </div>
  );
};

// ── Candidates ────────────────────────────────────────────────────────────────

const AttemptModal = ({ exam, attemptId, onClose, onReset, confirm }) => {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (!attemptId) return;
    setDetail(null);
    getLiveExamAttemptDetail(exam.id, attemptId).then((res) => setDetail(res.data)).catch(() => setDetail({ error: true }));
  }, [exam.id, attemptId]);

  return (
    <Modal
      open={!!attemptId}
      onClose={onClose}
      size="lg"
      title={detail?.user ? `${detail.user.fullName} — ${detail.user.email}` : 'Attempt'}
      footer={detail?.attempt && (
        <button
          onClick={() => confirm({
            title: 'Reset this attempt?',
            message: 'Their answers are deleted and they can sit the exam again (while it is open). Use only for a genuine technical problem.',
            confirmLabel: 'Reset attempt',
            onConfirm: onReset,
          })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset attempt
        </button>
      )}
    >
      {!detail ? <p className="text-sm text-slate-400">Loading…</p> : detail.error ? <p className="text-sm text-red-600">Could not load this attempt.</p> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatTile label="Status" value={detail.attempt.status === 'completed' ? 'Submitted' : 'In progress'} />
            <StatTile label="Score" value={detail.attempt.score} />
            <StatTile label="Correct" value={detail.attempt.total_correct} />
            <StatTile label="Wrong" value={detail.attempt.total_wrong} />
            <StatTile label="Time" value={fmtDuration(detail.attempt.time_taken_seconds)} />
          </div>
          <ReviewList questions={detail.questions} showMarking={detail.attempt.status === 'completed'} />
        </div>
      )}
    </Modal>
  );
};

const CandidatesTab = ({ exam, showToast, confirm, onAttemptsChanged }) => {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [openAttempt, setOpenAttempt] = useState(null);

  const load = useCallback(() => {
    getLiveExamResults(exam.id).then((res) => setData(res.data)).catch((err) => showToast('error', errorMessage(err, 'Could not load candidates')));
  }, [exam.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const downloadCsv = async () => {
    try {
      const res = await getLiveExamResultsCsv(exam.id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${exam.slug}-results.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('error', errorMessage(err, 'Could not export'));
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.candidates ?? []).filter((c) =>
      (status === 'admin' ? c.is_admin : !c.is_admin && (status === 'all' || c.status === status)) &&
      (!q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)));
  }, [data, query, status]);

  const handleReset = async () => {
    try {
      await resetLiveExamAttempt(exam.id, openAttempt);
      showToast('success', 'Attempt reset');
      setOpenAttempt(null);
      load();
      onAttemptsChanged();
    } catch (err) {
      showToast('error', errorMessage(err, 'Could not reset'));
    }
  };

  if (!data) return <p className="text-sm text-slate-400">Loading…</p>;
  const { stats, domains } = data;

  return (
    <div className="space-y-5">
      <AttemptModal exam={exam} attemptId={openAttempt} onClose={() => setOpenAttempt(null)} onReset={handleReset} confirm={confirm} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Submitted" value={stats.candidates} />
        <StatTile label="Average" value={`${stats.average_percent}%`} sub={`avg ${stats.average_score} marks`} />
        <StatTile label="Median" value={`${stats.median_percent}%`} />
        <StatTile label="Highest" value={`${stats.highest_percent}%`} sub={`${stats.highest_score} marks`} />
        <StatTile label="Pass rate" value={stats.pass_rate == null ? '—' : `${stats.pass_rate}%`} sub={stats.pass_rate == null ? 'no pass mark set' : `${stats.pass_count} passed`} />
      </div>

      {stats.candidates > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Score distribution"><ScoreDistribution distribution={stats.distribution} /></Section>
          <Section title="Average by domain">
            <DomainBars rows={domains.map((d) => ({ key: d.key, label: d.label, value: d.average_percent, detail: `${d.questions} Qs` }))} />
          </Section>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200">
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-9`} placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All students ({data.candidates.filter((c) => !c.is_admin).length})</option>
            <option value="completed">Submitted</option>
            <option value="in_progress">In progress</option>
            <option value="admin">Admin tests ({data.candidates.filter((c) => c.is_admin).length})</option>
          </select>
          <button onClick={load} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Refresh</button>
          <button onClick={downloadCsv} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-hover">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                {['Rank', 'Candidate', 'Status', 'Answered', 'Correct', 'Wrong', 'Unanswered', 'Score', '%', 'Time'].map((h, i) => (
                  <th key={h} className={`font-medium px-3 py-2 ${i < 3 ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.attempt_id} onClick={() => setOpenAttempt(c.attempt_id)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                  <td className="px-3 py-2 font-semibold text-slate-700">{c.rank ?? '—'}</td>
                  <td className="px-3 py-2">
                    <p className="text-slate-900">{c.full_name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    {c.status === 'completed'
                      ? <span className="text-xs text-green-700">Submitted</span>
                      : <span className="text-xs text-amber-700">In progress</span>}
                    {c.is_admin && <span className="ml-2 text-xs text-slate-400">Admin test</span>}
                    {c.passed != null && <span className={`ml-2 text-xs ${c.passed ? 'text-green-700' : 'text-slate-400'}`}>{c.passed ? 'Pass' : 'Fail'}</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.answered_count}/{c.question_count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.status === 'completed' ? c.total_correct : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.status === 'completed' ? c.total_wrong : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.status === 'completed' ? c.total_unanswered : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.status === 'completed' ? c.score : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.status === 'completed' ? `${c.percent}%` : '—'}</td>
                  <td className="px-3 py-2 text-right text-xs text-slate-500">{c.status === 'completed' ? fmtDuration(c.time_taken_seconds) : '—'}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">No candidates yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500">Click a row to see every answer. Admin test attempts are never ranked or counted.</p>
    </div>
  );
};

// ── Questions ─────────────────────────────────────────────────────────────────

const QuestionsTab = ({ exam, showToast }) => {
  const [data, setData] = useState(null);
  const [sort, setSort] = useState('number');

  useEffect(() => {
    getLiveExamQuestionStats(exam.id).then((res) => setData(res.data)).catch((err) => showToast('error', errorMessage(err, 'Could not load question stats')));
  }, [exam.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <p className="text-sm text-slate-400">Loading…</p>;
  const questions = [...data.questions].sort((a, b) =>
    sort === 'hardest' ? a.correct_percent - b.correct_percent : sort === 'easiest' ? b.correct_percent - a.correct_percent : a.number - b.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Based on {data.candidates} submitted attempt(s).</p>
        <select className={`${inputClass} w-auto`} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="number">Paper order</option>
          <option value="hardest">Hardest first</option>
          <option value="easiest">Easiest first</option>
        </select>
      </div>
      {questions.map((q) => (
        <div key={q.question_id} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-800"><span className="font-semibold text-slate-500 mr-2">Q{q.number}</span>{q.question_text}</p>
            <div className="text-right shrink-0">
              <p className="text-lg font-black tabular-nums text-slate-900">{q.correct_percent}%</p>
              <p className="text-[11px] text-slate-400">correct</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{q.domain}{q.subject ? ` · ${q.subject}` : ''} · {q.unanswered} left it blank</p>
          <div className="mt-3 space-y-1.5">
            {q.options.map((o) => {
              const pct = data.candidates ? Math.round((o.picks / data.candidates) * 100) : 0;
              return (
                <div key={o.option_key} className="flex items-center gap-2 text-xs" title={`${o.picks} picked ${o.option_key}`}>
                  <span className={`w-5 font-bold ${o.is_correct ? 'text-green-700' : 'text-slate-500'}`}>{o.option_key}</span>
                  <div className="relative flex-1 h-2 rounded-full bg-slate-100">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${o.is_correct ? 'bg-green-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right tabular-nums text-slate-600">{o.picks} ({pct}%)</span>
                  <span className="hidden md:block w-64 truncate text-slate-500">{o.option_text}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const AdminLiveExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useAdminToast();
  const [exam, setExam] = useState(null);
  const [tab, setTab] = useState('overview');
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    getLiveExamAdmin(id).then((res) => setExam(res.data)).catch((err) => showToast('error', errorMessage(err, 'Could not load the exam')));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Live counts while the exam is running.
  useEffect(() => {
    if (exam?.phase !== 'open') return undefined;
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [exam?.phase, load]);

  const handleDelete = async () => {
    try {
      await deleteLiveExam(exam.id);
      navigate('/admin/live-exams');
    } catch (err) {
      showToast('error', errorMessage(err, 'Could not delete'));
    }
  };

  return (
    <AdminLayout>
      <Toast toast={toast} />
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <Link to="/admin/live-exams" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Live Exams
        </Link>

        {!exam ? <p className="text-sm text-slate-400">Loading…</p> : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
                  <PhaseBadge phase={exam.phase} />
                  {exam.show_in_nav
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><Eye className="w-3.5 h-3.5" /> Visible</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><EyeOff className="w-3.5 h-3.5" /> Hidden</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{fmtDateTime(exam.opens_at)} → {fmtDateTime(exam.closes_at)}</p>
              </div>
              {exam.counts.started === 0 && exam.admin_test_attempts === 0 && (
                <button
                  onClick={() => setDialog({
                    title: 'Delete this live exam?',
                    message: 'Its paper stays behind as an unpublished mock under Mock Tests.',
                    onConfirm: handleDelete,
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>

            <Lifecycle exam={exam} />

            <div className="flex gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && <OverviewTab exam={exam} onChange={setExam} showToast={showToast} confirm={setDialog} />}
            {tab === 'candidates' && <CandidatesTab exam={exam} showToast={showToast} confirm={setDialog} onAttemptsChanged={load} />}
            {tab === 'questions' && <QuestionsTab exam={exam} showToast={showToast} />}
          </>
        )}
      </div>
      {/* Last, so it stacks above the attempt modal it can be opened from. */}
      <ConfirmDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        onConfirm={() => dialog?.onConfirm()}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        confirmClass={dialog?.confirmClass}
      />
    </AdminLayout>
  );
};
