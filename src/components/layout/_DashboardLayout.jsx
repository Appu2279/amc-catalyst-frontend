import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  UndoDotIcon,
  Trophy,
  LogOut,
  Search,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';

const NAV = [
  { key: 'dashboard', to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { key: 'notes', to: '/notes', label: 'Notes', short: 'Notes', icon: NotebookPen },
  { key: 'recall', to: '/recall', label: 'Recall', short: 'Recall', icon: UndoDotIcon },
  { key: 'mock-exam', to: '/mock-exam', label: 'Mock Exams', short: 'Exams', icon: Trophy },
];

export const DashboardLayout = ({ children, active, collapseNav = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(collapseNav);

  useEffect(() => setCollapsed(collapseNav), [collapseNav]);

  const isActive = (item) => active === item.key || location.pathname === item.to;

  return (
    <div className="flex h-dvh bg-slate-50">
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
              className={`object-contain rounded-lg bg-white p-1 transition-all duration-200 ${
                collapsed ? 'w-11 h-11' : 'w-14 h-14'
              }`}
            />
            {!collapsed && (
              <span className="font-extrabold text-lg text-slate-900 tracking-tight ml-2">
                AMC Catalyst
              </span>
            )}
          </Link>

          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className={`flex-1 space-y-1.5 mt-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = isActive(item);
            return (
              <Link
                key={item.key}
                to={item.to}
                title={collapsed ? `${item.label}${item.comingSoon ? ' (Coming Soon)' : ''}` : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`flex items-center justify-between py-2.5 rounded-xl group transition-all ${
                  collapsed ? 'justify-center px-0' : 'px-3.5'
                } ${
                  current
                    ? 'text-brand-violet bg-brand-violet/10 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${collapsed ? '' : 'mr-3'} ${
                      current ? 'text-brand-violet' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                </div>

                {!collapsed && item.comingSoon && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Soon ⏳
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`py-4 border-t border-slate-200 space-y-2 ${collapsed ? 'px-2' : 'px-4'}`}>
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            aria-label={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl group transition-colors ${
              collapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} text-slate-400 group-hover:text-red-500`} />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-violet focus:border-brand-violet text-xs sm:text-sm transition"
                placeholder="Search topics, questions, or notes..."
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/profile"
              title="Edit profile"
              aria-label="Edit profile"
              className={`group flex items-center space-x-3 border-l border-slate-200 pl-3 sm:pl-4 rounded-lg py-1 pr-1 sm:pr-2 transition-colors hover:bg-slate-50 ${
                location.pathname === '/profile' ? 'text-brand-violet' : ''
              }`}
            >
              <UserAvatar className="w-8 h-8 rounded-full shadow-xs ring-2 ring-transparent group-hover:ring-brand-violet/20 transition shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 hidden sm:block">
                {user?.fullName ?? user?.name}
              </span>
            </Link>
          </div>
        </header>

        <div className="pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-50 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = isActive(item);
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                  current ? 'text-brand-violet font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${current ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{item.short}</span>
                {item.comingSoon && (
                  <span className="absolute -top-1 right-1 text-[8px] font-black px-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
