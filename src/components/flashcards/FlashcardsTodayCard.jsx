import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { DAILY_GOAL, loadProgress, getStreak, getTodayCount, getDueCards, getMinutesFor } from '@/utils/flashcardProgress';

/**
 * The flashcards nudge on the student Dashboard: streak, today's goal and how
 * many cards are due, with one tap into the review. Seen on every login, so
 * the habit does not depend on remembering to open Flashcards.
 *
 * Reads the same browser-stored progress as the Flashcards page. The due
 * count here does not know which topics a lapsed plan has locked; the page
 * itself leaves those out.
 */
export const FlashcardsTodayCard = () => {
  const progress = useMemo(loadProgress, []);
  const streak = getStreak(progress);
  const todayCount = getTodayCount(progress);
  const dueCount = getDueCards(progress).length;
  const isGoalMet = todayCount >= DAILY_GOAL;

  const action = dueCount > 0
    ? { to: '/flashcards?session=due', label: `Review ${dueCount} due`, sub: `about ${getMinutesFor(dueCount)} min` }
    : { to: '/flashcards', label: todayCount > 0 ? 'Keep going' : 'Start flashcards', sub: 'nothing due right now' };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-brand-blue text-white p-5 shadow-md">
      <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-white/80" />
          <p className="text-sm font-bold">Flashcards</p>
        </div>

        <div className="flex items-center gap-2" title="Day streak">
          <Flame className={`w-6 h-6 ${streak > 0 ? 'text-amber-300 fill-amber-300/40' : 'text-white/50'}`} />
          <p className="text-sm">
            <span className="text-xl font-black tabular-nums">{streak}</span>
            <span className="text-white/75"> day streak</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ProgressRing value={todayCount / DAILY_GOAL} size={40} strokeWidth={4} colorClass="text-white" trackClass="stroke-white/25">
            {isGoalMet
              ? <CheckCircle2 className="w-4 h-4 text-white" />
              : <span className="text-[9px] font-bold tabular-nums">{todayCount}/{DAILY_GOAL}</span>}
          </ProgressRing>
          <p className="text-xs text-white/80">{isGoalMet ? 'Daily goal done!' : "Today's goal"}</p>
        </div>

        <Link
          to={action.to}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-violet-700 shadow-sm hover:bg-violet-50 transition"
        >
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold">{action.label}</span>
            <span className="block text-[11px] text-violet-500">{action.sub}</span>
          </span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
