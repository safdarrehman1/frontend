'use client';

import { useEffect, useRef, useState } from 'react';
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
  onOpenDetails: () => void;
  isOnline?: boolean;
  lastSeenAt?: string | null;
};

function presenceLabel(isOnline?: boolean, lastSeenAt?: string | null) {
  if (isOnline) return 'Last active just now';
  if (!lastSeenAt) return 'Last seen unavailable';

  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const isToday = lastSeen.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeen.toDateString() === yesterday.toDateString();
  const time = lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Last seen today at ${time}`;
  if (isYesterday) return `Last seen yesterday at ${time}`;
  return `Last seen ${lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
}

export default function ChatHeader({ conversation, name, initials, search, showPinned, showStarred, onBack, onSearch, onTogglePinned, onToggleStarred, onOpenDetails, isOnline, lastSeenAt }: Props) {
  const isGroup = conversation?.type === 'group';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showMenu]);

  const runMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <header className="relative z-30 flex min-h-[76px] shrink-0 flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <button type="button" onClick={onBack} aria-label="Back to chats" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button type="button" onClick={onOpenDetails} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border-0 text-left outline-none transition hover:opacity-80 focus:outline-none focus-visible:outline-none" aria-label={`View ${name} details`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-200 dark:shadow-none">{initials}</span>
        <span className="min-w-32 flex-1">
          <span className="block truncate font-bold tracking-tight text-slate-950 dark:text-white">{name}</span>
          <span className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${isGroup || isOnline ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${isGroup || isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />{isGroup ? `${conversation?.participants.length || 0} members` : presenceLabel(isOnline, lastSeenAt)}</span>
        </span>
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setShowMenu((value) => !value)}
          aria-label="Conversation options"
          aria-haspopup="menu"
          aria-expanded={showMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-blue-500/10"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        {showMenu && (
          <div role="menu" className="chat-options-menu absolute right-0 top-12 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
            <button type="button" role="menuitem" onClick={() => runMenuAction(onTogglePinned)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">📌</span>
              <span className="flex-1">Pinned messages</span>
              {showPinned && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Active" />}
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(onToggleStarred)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-amber-500 dark:bg-slate-800">★</span>
              <span className="flex-1">Starred messages</span>
              {showStarred && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Active" />}
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <ThemeToggle menuItem onSelect={() => setShowMenu(false)} />
          </div>
        )}
      </div>
      <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900 dark:focus-within:bg-slate-900 sm:w-48">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-4-4" /></svg>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search messages" aria-label="Search messages" className="h-full min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
      </div>
    </header>
  );
}
