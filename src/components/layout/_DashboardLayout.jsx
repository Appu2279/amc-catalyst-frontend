import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  UndoDotIcon,
  Trophy,
  LogOut,
  Bell,
  Search,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// One source of truth for the desktop sidebar and the mobile bottom bar, so the
// two can no longer drift apart the way they did while QBank was being hidden.
//
// QBank is deliberately absent: the /qbank route still works and a direct link
// keeps working, only the nav entry is gone for now. Re-add it here and it
// reappears in both navs at once.
const NAV = [
  { key: 'dashboard', to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { key: 'notes', to: '/notes', label: 'Notes', short: 'Notes', icon: NotebookPen },
  { key: 'recall', to: '/recall', label: 'Recall', short: 'Recall', icon: UndoDotIcon },
  { key: 'mock-exam', to: '/mock-exam', label: 'Mock Exams', short: 'Exams', icon: Trophy },
];

/**
 * DashboardLayout
 *
 * `collapseNav` lets a page ask for the reading-focused chrome: the sidebar
 * shrinks to an icon rail. Notes uses it while a note is open so the nav stops
 * competing with the page being read, and drops it again on the way back to the
 * grid. It is a request, not a lock — the user can still toggle the rail open
 * from inside a note, and their choice stands until the page asks again.
 */
export const DashboardLayout = ({ children, active, collapseNav = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(collapseNav);

  useEffect(() => setCollapsed(collapseNav), [collapseNav]);

  const isActive = (item) => active === item.key || location.pathname === item.to;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`hidden bg-white border-r border-slate-200 md:flex flex-col transition-[width] duration-200 ease-out ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <div
          className={`flex ${collapsed ? 'flex-col items-center gap-2 pt-3' : 'items-center justify-between pr-3'}`}
        >
          <Link to="/" className="flex items-center min-w-0">
            <img
              src="/images/logo.png"
              alt="AMC Catalyst Logo"
              // Smaller than the old 80px mark: the collapse control now shares
              // this row, and at 80px the wordmark beside it truncated.
              className={`object-contain rounded-lg bg-white p-1 transition-all duration-200 ${
                collapsed ? 'w-11 h-11' : 'w-14 h-14'
              }`}
            />
            {!collapsed && (
              <span className="text-lg font-bold text-slate-900 truncate">AMC CATALYST</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className={`flex-1 space-y-2 mt-4 ${collapsed ? 'px-2' : 'px-4'}`}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = isActive(item);
            return (
              <Link
                key={item.key}
                to={item.to}
                // The label is the only thing a collapsed rail can offer as a
                // hint, so it becomes the tooltip.
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`flex items-center py-3 rounded-lg group transition-colors ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  current
                    ? 'text-brand-blue bg-brand-blue/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} ${
                    current ? '' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`py-4 border-t border-slate-200 space-y-2 ${collapsed ? 'px-2' : 'px-4'}`}>
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            aria-label={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg group transition-colors ${
              collapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} text-slate-400 group-hover:text-red-500`} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
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
        <div className="pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around h-16">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item) ? 'text-brand-blue' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
