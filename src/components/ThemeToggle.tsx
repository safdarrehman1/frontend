'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const initialize = useThemeStore((state) => state.initialize);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => initialize(), [initialize]);

  return (
    <button type="button" onClick={toggleTheme} title={`Use ${theme === 'light' ? 'dark' : 'light'} mode`} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} mode`} className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
      {theme === 'light' ? '☾' : '☀'}
    </button>
  );
}
