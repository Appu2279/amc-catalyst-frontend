import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  BookOpen,
  UndoDotIcon,
  Trophy,
  Settings,
  LogOut,
  Bell,
  Search,
  NotebookPen,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const DashboardLayout = ({ children, active }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 bg-white border-r border-slate-200 md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-brand-blue to-brand-violet rounded-lg">
              <div className="w-5 h-5 text-white flex items-center justify-center font-bold">A</div>
            </div>
            <span className="text-lg font-bold text-slate-900">AMC CATALYST</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-3 rounded-lg group transition-colors ${
              (active === "dashboard" || location.pathname === "/dashboard")
                ? "text-brand-blue bg-brand-blue/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/notes"
            className={`flex items-center px-4 py-3 rounded-lg group transition-colors ${
              (active === "notes" || location.pathname === "/notes")
                ? "text-brand-blue bg-brand-blue/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <NotebookPen className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span className="font-medium">Notes</span>
          </Link>
          <Link
            to="/qbank"
            className={`flex items-center px-4 py-3 rounded-lg group transition-colors ${
              (active === "qbank" || location.pathname === "/qbank")
                ? "text-brand-blue bg-brand-blue/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span className="font-medium">QBank</span>
          </Link>
          <a href="#" className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg group transition-colors">
            <UndoDotIcon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span className="font-medium">Recall</span>
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg group transition-colors">
            <Trophy className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span className="font-medium">Mock Exams</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-2">
          <a href="#" className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg group transition-colors">
            <Settings className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span className="font-medium">Settings</span>
          </a>
          <button onClick={logout} className="w-full flex items-center px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg group transition-colors">
            <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                placeholder="Search topics, questions, or videos..."
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-violet text-white flex items-center justify-center font-bold">
                {user?.fullName?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};
