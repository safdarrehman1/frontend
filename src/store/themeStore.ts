import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  initialize: () => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  initialize: () => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('chat-theme') as Theme | null : null;
    const theme = saved === 'dark' || saved === 'light' ? saved : 'light';
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('chat-theme', theme);
    applyTheme(theme);
    set({ theme });
  }
}));
