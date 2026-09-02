import React from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { BookOpen, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QBank = () => {
  return (
    <DashboardLayout active="qbank">
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 min-h-[calc(100vh-5rem)] bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600 shadow-sm">
            <BookOpen className="w-8 h-8 text-amber-600" />
          </div>
          
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-widest mb-3">
            Coming Soon ⏳
          </span>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            MCQ QBank Under Preparation
          </h1>
          
          <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
            Our specialist team is compiling subject-wise MCQs aligned with Australian Medical Council standards.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2.5">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Subject-wise Adaptive MCQs</span>
            </p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>ETG & Australian Guideline References</span>
            </p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>AMC Part 1 Blueprint Analytics</span>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <Link
              to="/mock-exam"
              className="w-full py-3 px-4 bg-brand-violet hover:bg-brand-violet-hover text-white text-xs font-bold rounded-xl transition shadow-md shadow-brand-violet/20 flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Take Mock Exams Instead
            </Link>
            <Link
              to="/dashboard"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
