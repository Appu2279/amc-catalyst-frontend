import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { getQuestions, getSubjectsPublic, checkAnswer } from '@/api/userService';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { Check, X, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, Lightbulb } from 'lucide-react';

const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

const diffLabel = (d) => d === '' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1);
const diffColor = (d, active) => {
  if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-400';
  const map = { '': 'bg-slate-800 text-white border-slate-800', easy: 'bg-green-600 text-white border-green-600', medium: 'bg-amber-500 text-white border-amber-500', hard: 'bg-red-600 text-white border-red-600' };
  return map[d] ?? 'bg-brand-blue text-white border-brand-blue';
};

// Splits on bullet-like separators. Pure \uXXXX escapes — no literal glyphs.
// •=• ‣=‣ ⁃=⁃ ·=· ▪=▪ ●=● ■=■ ▸=▸
// ∙=∙ ≡=≡ ☰=☰ =PDF-private-use-bullet
const BULLET_RE = /[•‣⁃·▪▫●○■□▸►∙≡☰☱☲]+/g;

const ExplanationText = ({ text, className = '' }) => {
  if (!text) return null;
  const parts = text.split(BULLET_RE).map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return <p className={`text-xs leading-relaxed ${className}`}>{text.trim()}</p>;
  }
  return (
    <ul className={`text-xs leading-relaxed space-y-1 ${className}`}>
      {parts.map((part, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
          <span>{part}</span>
        </li>
      ))}
    </ul>
  );
};

export const QBank = () => {
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [subjects, setSubjects]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const [checking, setChecking]       = useState(false); // API call in-flight
  const [checked, setChecked]         = useState(false);
  const [checkResult, setCheckResult] = useState(null);  // response from /check endpoint
  const [score, setScore]             = useState({ correct: 0, wrong: 0 });
  const [filters, setFilters]         = useState({ subject_id: '', difficulty: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    getSubjectsPublic()
      .then(res => setSubjects(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setCurrentIdx(0);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
    try {
      const params = { source_type: 'qbank', limit: 500, is_active: true };
      if (filters.subject_id) params.subject_id = filters.subject_id;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      const res = await getQuestions(params);
      setQuestions(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const q = questions[currentIdx];

  // These come from the /check response — never sent with the question list
  const isCorrect  = checkResult?.is_correct;
  const correctOpt = checkResult?.options?.find(o => o.is_correct);

  // Fast lookup: option id → revealed data
  const revealMap = checkResult
    ? Object.fromEntries(checkResult.options.map(o => [o.id, o]))
    : {};

  // Click → POST /questions/:id/check → reveal
  const handleSelect = async (optId) => {
    if (checked || checking) return;
    setSelectedId(optId);
    setChecking(true);
    try {
      const res = await checkAnswer(q.id, { selected_option_id: optId });
      const result = res.data?.data ?? res.data;
      setCheckResult(result);
      setChecked(true);
      setScore(s => ({
        correct: s.correct + (result.is_correct ? 1 : 0),
        wrong:   s.wrong   + (result.is_correct ? 0 : 1),
      }));
    } catch {
      setSelectedId(null); // undo selection so student can retry
    } finally {
      setChecking(false);
    }
  };

  const go = (dir) => {
    const next = currentIdx + dir;
    if (next < 0 || next >= questions.length) return;
    setCurrentIdx(next);
    setSelectedId(null);
    setChecked(false);
    setCheckResult(null);
  };

  const images = q
    ? (q.question_images?.length ? q.question_images : q.question_image ? [q.question_image] : [])
    : [];

  // ── Filter panel ────────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</p>
        <select
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          value={filters.subject_id}
          onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</p>
        <div className="flex flex-col gap-1.5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setFilters(f => ({ ...f, difficulty: d }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-left ${diffColor(d, filters.difficulty === d)}`}
            >
              {diffLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {(score.correct + score.wrong) > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Session Score</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <Check className="w-4 h-4" /> {score.correct}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
              <X className="w-4 h-4" /> {score.wrong}
            </span>
            <button
              onClick={() => setScore({ correct: 0, wrong: 0 })}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600"
              title="Reset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout active="qbank">
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <div className="flex h-full overflow-hidden">

        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h1 className="text-base font-bold text-slate-900">QBank Practice</h1>
            <p className="text-xs text-slate-400 mt-0.5">{total} questions</p>
          </div>
          <div className="p-4 flex-1">
            <FilterPanel />
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
            <div>
              <h1 className="text-sm font-bold text-slate-900">QBank Practice</h1>
              <p className="text-xs text-slate-400">{total} questions</p>
            </div>
            <div className="flex items-center gap-2">
              {(score.correct + score.wrong) > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  <span className="text-green-600">{score.correct}</span>
                  {' / '}
                  <span className="text-red-500">{score.wrong}</span>
                </span>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-brand-blue text-white border-brand-blue' : 'border-slate-200 text-slate-600'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4">
              <FilterPanel />
            </div>
          )}

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <div className="w-7 h-7 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <p className="text-slate-400 text-sm">No questions found for the selected filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Progress + counter */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">
                      Question <strong className="text-slate-700">{currentIdx + 1}</strong> of {questions.length}
                    </span>
                    {q.subject && (
                      <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {q.subject.name}{q.topic ? ` · ${q.topic.name}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1">
                    <div
                      className="bg-brand-blue h-1 rounded-full transition-all duration-500"
                      style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="px-5 py-4">

                  {/* Question text */}
                  <p className="text-base font-semibold text-slate-900 leading-snug mb-4">
                    {q.question_text}
                  </p>

                  {/* Question images */}
                  {images.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 items-center">
                      {images.map((src, i) => (
                        <ProtectedImage
                          key={i}
                          src={src}
                          alt={`Question image ${i + 1}`}
                          className="max-w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50"
                          onClick={setLightboxSrc}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hint before selection */}
                  {!checked && !checking && (
                    <p className="text-[11px] text-slate-400 mb-3 italic">
                      Select an option — explanations will be revealed instantly
                    </p>
                  )}

                  {/* Result banner */}
                  {checked && (
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl mb-3 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <p className={`text-sm font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct!' : `Incorrect — correct answer is ${correctOpt?.option_key}`}
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {[...(q.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map(opt => {
                      const isThisSelected = opt.id === selectedId;
                      const isThisCorrect  = checked ? (revealMap[opt.id]?.is_correct ?? false) : false;

                      let cardCls, dotCls;
                      if (!checked) {
                        if (checking && isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-wait';
                          dotCls  = 'bg-brand-blue text-white';
                        } else if (isThisSelected) {
                          cardCls = 'border-brand-blue bg-blue-50 cursor-pointer';
                          dotCls  = 'bg-brand-blue text-white';
                        } else {
                          cardCls = checking
                            ? 'border-slate-200 bg-white cursor-not-allowed opacity-60'
                            : 'border-slate-200 bg-white hover:border-brand-blue hover:bg-blue-50/50 cursor-pointer';
                          dotCls  = 'bg-slate-100 text-slate-600';
                        }
                      } else {
                        if (isThisCorrect) {
                          cardCls = 'border-green-400 bg-green-50 cursor-default';
                          dotCls  = 'bg-green-500 text-white';
                        } else if (isThisSelected) {
                          cardCls = 'border-red-400 bg-red-50 cursor-default';
                          dotCls  = 'bg-red-500 text-white';
                        } else {
                          cardCls = 'border-slate-200 bg-slate-50 cursor-default';
                          dotCls  = 'bg-slate-200 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect(opt.id)}
                          disabled={checking || checked}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${cardCls}`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${dotCls}`}>
                            {checking && isThisSelected
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : opt.option_key
                            }
                          </span>
                          <span className={`text-sm font-medium flex-1 leading-snug ${checked && !isThisCorrect && !isThisSelected ? 'text-slate-500' : 'text-slate-800'}`}>
                            {opt.option_text}
                          </span>
                          {checked && isThisCorrect                    && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                          {checked && isThisSelected && !isThisCorrect && <X     className="w-4 h-4 text-red-500  shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Explanations panel ───────────────────────────────────── */}
                  {checked && checkResult && (checkResult.options ?? []).some(o => o.explanation) && (
                    <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Explanations</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[...(checkResult.options ?? [])].sort((a, b) => a.option_key.localeCompare(b.option_key)).map(opt => {
                          const isThisCorrect  = opt.is_correct;
                          const isThisSelected = opt.id === selectedId;
                          let badgeCls = 'bg-slate-200 text-slate-500';
                          if (isThisCorrect)       badgeCls = 'bg-green-500 text-white';
                          else if (isThisSelected) badgeCls = 'bg-red-500 text-white';
                          return (
                            <div key={opt.id} className="flex gap-3 px-4 py-3">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${badgeCls}`}>
                                {opt.option_key}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold mb-1 ${
                                  isThisCorrect ? 'text-green-700' : isThisSelected ? 'text-red-700' : 'text-slate-600'
                                }`}>
                                  {opt.option_text}
                                </p>
                                {opt.option_image && (
                                  <ProtectedImage
                                    src={opt.option_image}
                                    alt={`Option ${opt.option_key} image`}
                                    className="mb-2 max-w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                    onClick={setLightboxSrc}
                                  />
                                )}
                                {opt.explanation
                                  ? <ExplanationText text={opt.explanation} className="text-slate-500" />
                                  : <span className="text-xs text-slate-300 italic">No explanation provided.</span>
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Question-level note: answer images + explanation */}
                  {checked && (checkResult?.answer_images?.length > 0 || checkResult?.explanation) && (
                    <div className="flex gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        {(checkResult.answer_images ?? []).map((src, i) => (
                          <div key={i} className="flex justify-center">
                            <ProtectedImage
                              src={src}
                              alt={`Answer image ${i + 1}`}
                              className="max-w-full max-h-64 object-contain rounded-lg border border-amber-200 bg-white"
                              onClick={setLightboxSrc}
                            />
                          </div>
                        ))}
                        {checkResult.explanation && (
                          <ExplanationText text={checkResult.explanation} className="text-amber-800" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => go(-1)}
                      disabled={currentIdx === 0}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <button
                      onClick={() => go(1)}
                      disabled={!checked || currentIdx === questions.length - 1}
                      className="px-5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                    >
                      Next Question
                    </button>

                    <button
                      onClick={() => go(1)}
                      disabled={currentIdx === questions.length - 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Skip <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
