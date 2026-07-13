'use client';

import { Conversation } from '../../types';
import ThemeToggle from '../ThemeToggle';

type Props = {
  conversation: Conversation | null;
  name: string;
  initials: string;
  search: string;
  showPinned: boolean;
  showStarred: boolean;
  onBack: () => void;
  onSearch: (value: string) => void;
  onTogglePinned: () => void;
  onToggleStarred: () => void;
};

export default function ChatHeader({ conversation, name, initials, search, showPinned, showStarred, onBack, onSearch, onTogglePinned, onToggleStarred }: Props) {
  const isGroup = conversation?.type === 'group';
  return (
    <header className="flex min-h-[73px] shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
      <button type="button" onClick={onBack} aria-label="Back to chats" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">{initials}</div>
      <div className="min-w-32 flex-1">
        <h1 className="truncate font-bold text-slate-900 dark:text-slate-100">{name}</h1>
        <p className="text-xs font-medium text-emerald-600">{isGroup ? `${conversation?.participants.length || 0} members` : 'Active conversation'}</p>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onTogglePinned} title="Pinned messages" className={`rounded-xl p-2 text-sm ${showPinned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>📌</button>
        <button type="button" onClick={onToggleStarred} title="Starred messages" className={`rounded-xl p-2 text-sm ${showStarred ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>★</button>
        <ThemeToggle />
      </div>
      <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search messages" aria-label="Search messages" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-44" />
    </header>
  );
}
