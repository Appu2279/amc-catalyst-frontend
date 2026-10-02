import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/utils/cn';

// Same key the inline script in index.html reads to set the class before
// React mounts, so a dark-theme visitor doesn't get a white flash on load.
const STORAGE_KEY = 'amc_catalyst_theme';

const ThemeContext = createContext(undefined);

const readStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readStoredTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

/**
 * Applies the chosen theme to <html> while mounted. Only the public pages are
 * wrapped in this — the dashboard and admin aren't styled for dark yet, so
 * leaving one of these pages (unmount) always drops back to light.
 */
export const ThemeArea = ({ children }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    return () => root.classList.remove('dark');
  }, [theme]);

  return children;
};

export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={cn(
        'p-2 rounded-lg text-slate-600 hover:text-brand-blue hover:bg-slate-100 transition-colors',
        className
      )}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
