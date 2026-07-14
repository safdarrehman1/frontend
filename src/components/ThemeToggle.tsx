'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle({ menuItem = false, onSelect }: { menuItem?: boolean; onSelect?: () => void }) {
  const theme = useThemeStore((state) => state.theme);
  const initialize = useThemeStore((state) => state.initialize);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => initialize(), [initialize]);

  return (
    <button
      type="button"
      onClick={() => { toggleTheme(); onSelect?.(); }}
      title={`Use ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={menuItem
        ? 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        : 'theme-toggle rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}
    >
      <span className={menuItem ? 'flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-800' : ''}>{theme === 'light' ? '☾' : '☀'}</span>
      {menuItem && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  );
}
