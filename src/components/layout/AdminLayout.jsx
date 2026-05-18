import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, BookOpen, HelpCircle, Upload,
  ClipboardList, GraduationCap, LogOut, Menu, X,
} from 'lucide-react';
import { getMockTests } from '@/api/adminService';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/subjects', label: 'Subjects & Topics', icon: BookOpen },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { path: '/admin/import-batches', label: 'Import Batches', icon: Upload },
  { path: '/admin/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { path: '/admin/courses', label: 'Courses', icon: GraduationCap },
];

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-none ${
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
};

export const useAdminToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast };
};

export { Toast };

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    getMockTests()
      .then((res) => {
        const tests = res.data?.data ?? res.data ?? [];
        setDraftCount(Array.isArray(tests) ? tests.filter((t) => !t.is_published).length : 0);
      })
      .catch(() => {});
  }, []);

  const adminName = user?.fullName ?? user?.name ?? user?.email ?? 'Admin';
  const initial = adminName.charAt(0).toUpperCase();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 shrink-0">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/images/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">AMC Catalyst</div>
            <div className="text-[10px] font-medium text-brand-blue uppercase tracking-widest">
              Admin
            </div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-blue text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Mock Tests' && draftCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {draftCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-violet text-white flex items-center justify-center text-sm font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{adminName}</div>
            <div className="text-xs text-slate-500">Administrator</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white border-r border-slate-200 h-full z-10 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-slate-200 shrink-0">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 text-sm font-semibold text-slate-900">AMC Catalyst Admin</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
