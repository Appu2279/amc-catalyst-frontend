import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radio, Clock, FileText, CalendarClock, CheckCircle2, Lock, ArrowRight, AlertTriangle, Trophy, PlayCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { useCurrentLiveExam } from '@/hooks/useCurrentLiveExam';
import { startLiveExam } from '@/api/liveExamService';
import { LiveExamMyResult } from '@/components/liveExam/LiveExamMyResult';
import {
  fmtLocalDateTime, fmtDuration, fmtCountdown, fmtRelative, localZoneName, errorMessage, serverOffset,
} from '@/components/liveExam/format';

/** Seconds until `target` by the server's clock, ticking every second. */
const useCountdown = (target, offsetMs) => {
  const compute = () => (target ? Math.max(0, (new Date(target).getTime() - (Date.now() + offsetMs)) / 1000) : 0);
  const [seconds, setSeconds] = useState(compute);
  useEffect(() => {
    setSeconds(compute());
    const t = setInterval(() => setSeconds(compute()), 1000);
    return () => clearInterval(t);
  }, [target, offsetMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return seconds;
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 ${className}`}>{children}</div>
);

const PaperFacts = ({ exam, toClose }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {[
      { icon: FileText, label: 'Questions', value: exam.total_questions },
      { icon: Clock, label: 'Time allowed', value: fmtDuration(exam.duration_minutes * 60) },
      {
        icon: CalendarClock, label: 'Closes', value: fmtLocalDateTime(exam.closes_at),
        sub: toClose > 0 ? fmtRelative(toClose) : null,
      },
    ].map(({ icon: Icon, label, value, sub }) => (
      <div key={label} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
        <Icon className="w-5 h-5 text-brand-violet shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
    ))}
  </div>
);

// The welcome text candidates read before starting, in the style of the real
// exam. The numbers come from the paper itself, so they always match what was set.
const Instructions = ({ exam }) => (
  <div className="text-[15px] leading-7 text-slate-700 space-y-4">
    <p>Welcome to <strong className="text-slate-900">{exam.title}</strong>.</p>
    <p>
      This exam consists of <strong className="text-slate-900">{exam.total_questions} multiple-choice questions</strong> (in
      single best answer format). Questions are shown <strong className="text-slate-900">one at a time, in order</strong>.
      Once you submit or skip a question, your answer is final — you cannot go back to it or change it.
    </p>
    <p>
      You have <strong className="text-slate-900">{exam.duration_minutes} minutes</strong> to complete the exam. The exam must
      be completed in <strong className="text-slate-900">one sitting</strong>. A timer is provided and the session will
      terminate upon reaching the time limit. The timer cannot be paused. You can also choose to submit your exam at any
      stage prior to the time limit by clicking the <strong className="text-slate-900">Finish</strong> button.
    </p>
    <p>
      Following submission, your answers are recorded. Results will be published on the AMC Catalyst website, where you
      will be able to see your individual results
      {exam.allow_answer_review ? ' and navigate through the exam to review the explanatory text accompanying each question' : ''}.
    </p>
    {exam.instructions && <p className="whitespace-pre-line">{exam.instructions}</p>}
  </div>
);

export const LiveExam = () => {
  const navigate = useNavigate();
  const { exam, loading, refresh } = useCurrentLiveExam();
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Always fresh on arrival: the cached copy may predate opening time or a submit.
  useEffect(() => { refresh(); }, [refresh]);

  // Measured once per server response. Recomputing it every render would pin
  // Date.now() + offset to the moment of the fetch and freeze the countdown.
  const offset = useMemo(() => serverOffset(exam?.server_now), [exam?.server_now]);
  const toOpen = useCountdown(exam?.opens_at, offset);
  const toClose = useCountdown(exam?.closes_at, offset);

  // Flip from "upcoming" to "open" (and "open" to "closed") without a reload.
  useEffect(() => {
    if (!exam) return;
    if ((exam.phase === 'upcoming' && toOpen <= 0) || (exam.phase === 'open' && toClose <= 0)) refresh();
  }, [exam, toOpen, toClose, refresh]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      await startLiveExam(exam.id);
      navigate('/live-exam/session');
    } catch (err) {
      setError(errorMessage(err, 'Could not start the exam. Please try again.'));
      refresh();
    } finally {
      setStarting(false);
    }
  };

  const attempt = exam?.my_attempt;
  const shortWindow = exam && exam.phase === 'open' && !attempt && toClose < exam.duration_minutes * 60;

  let body;
  if (loading && exam === undefined) {
    body = <div className="p-16 text-center text-sm text-slate-400">Loading…</div>;
  } else if (!exam) {
    body = (
      <Card className="text-center">
        <Radio className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">There is no live exam right now.</p>
        <p className="text-sm text-slate-400 mt-1">Keep an eye on your dashboard — the next one will appear here.</p>
      </Card>
    );
  } else if (exam.phase === 'results') {
    body = attempt?.status === 'completed'
      ? <LiveExamMyResult examId={exam.id} slug={exam.slug} />
      : (
        <Card className="text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Results for {exam.title} are out.</p>
          {exam.public_results ? (
            <>
              <p className="text-sm text-slate-400 mt-1">You did not sit this exam, but you can see how everyone did.</p>
              <Link to={`/results/${exam.slug}`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-violet hover:underline">
                View results <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-1">You did not sit this exam.</p>
          )}
        </Card>
      );
  } else if (attempt?.status === 'completed') {
    body = (
      <Card className="text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Your exam has been submitted</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          All your answers are recorded. Results will be published on the AMC Catalyst website once marking is
          complete — we&apos;ll let you know.
        </p>
        <p className="text-xs text-slate-400 mt-4">Submitted {fmtLocalDateTime(attempt.completed_at)} (your time)</p>
      </Card>
    );
  } else if (attempt?.status === 'in_progress') {
    body = (
      <Card className="text-center">
        <PlayCircle className="w-14 h-14 text-brand-violet mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Your exam is in progress</h2>
        <p className="text-sm text-slate-500 mt-2">The timer is still running. Pick up where you left off.</p>
        <button
          onClick={() => navigate('/live-exam/session')}
          className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-violet hover:bg-brand-violet-hover text-white font-semibold"
        >
          Resume exam <ArrowRight className="w-4 h-4" />
        </button>
      </Card>
    );
  } else if (exam.phase === 'upcoming') {
    body = (
      <Card className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Opens in</p>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums mt-1">{fmtCountdown(toOpen)}</p>
          <p className="text-sm text-slate-600 mt-2">
            <span className="font-semibold">{fmtLocalDateTime(exam.opens_at)}</span> your time
          </p>
        </div>
        <PaperFacts exam={exam} toClose={toClose} />
        <Instructions exam={exam} />
      </Card>
    );
  } else if (exam.phase === 'open') {
    body = (
      <Card className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> The exam is open now
        </div>
        <Instructions exam={exam} />
        <PaperFacts exam={exam} toClose={toClose} />
        {shortWindow && (
          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              The exam closes at {fmtLocalDateTime(exam.closes_at)} your time ({fmtRelative(toClose)}), so if you start now you will have only{' '}
              <strong>{fmtDuration(toClose)}</strong> instead of the full {fmtDuration(exam.duration_minutes * 60)}.
            </p>
          </div>
        )}
        <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-violet-600" />
          I understand I have one attempt and the timer starts as soon as I begin.
        </label>
        {error && <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</p>}
        <button
          onClick={handleStart}
          disabled={!agreed || starting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-violet hover:bg-brand-violet-hover text-white font-semibold disabled:opacity-50"
        >
          {starting ? 'Starting…' : <>Start exam <ArrowRight className="w-4 h-4" /></>}
        </button>
      </Card>
    );
  } else {
    body = (
      <Card className="text-center">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-medium">This exam has closed.</p>
        <p className="text-sm text-slate-400 mt-1">Results will be published on the website soon.</p>
      </Card>
    );
  }

  return (
    <DashboardLayout active="live-exam">
      <div className="py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-violet">
              <Radio className="w-4 h-4" /> Live Exam
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{exam?.title ?? 'Live Exam'}</h1>
            {exam?.description && <p className="text-slate-500 text-sm mt-1 whitespace-pre-line">{exam.description}</p>}
            {exam && exam.phase !== 'results' && (
              <p className="text-xs text-slate-400 mt-1">All times are shown in your local time ({localZoneName()}).</p>
            )}
          </div>
          {body}
        </div>
      </div>
    </DashboardLayout>
  );
};
