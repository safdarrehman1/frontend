'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllUsers } from '../lib/api/user';
import { createDirectConversation } from '../lib/api/conversations';
import { User } from '../types';

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function NewChatModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsers(await fetchAllUsers());
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleSelectUser = async (userId: number) => {
    setCreatingId(userId);
    try {
      const conversation = await createDirectConversation(userId);
      onClose();
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
    } finally {
      setCreatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 id="new-chat-title" className="text-xl font-bold tracking-tight text-slate-900">Start a new chat</h2>
            <p className="mt-1 text-sm text-slate-500">Choose someone to begin a conversation.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-400" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-4-4" /></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto border-t border-slate-100 p-3">
          {loading ? (
            <p className="p-6 text-center text-sm text-slate-500">Loading people...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No matching users found.</p>
          ) : filteredUsers.map((user) => (
            <button type="button" key={user.id} onClick={() => handleSelectUser(user.id)} disabled={creatingId !== null} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50 disabled:opacity-50">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                {initials(user.name)}
                {user.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600">{creatingId === user.id ? 'Opening...' : 'Chat'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
