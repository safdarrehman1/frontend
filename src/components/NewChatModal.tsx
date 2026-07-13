'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllUsers } from '../lib/api/user';
import { createDirectConversation, createGroupConversation } from '../lib/api/conversations';
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
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    setCreatingId(userId);
    try {
      const conversation = await createDirectConversation(userId);
      onClose();
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
      setError('The conversation could not be created. Please try again.');
    } finally {
      setCreatingId(null);
    }
  };

  const toggleGroupMember = (userId: number) => {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    setCreatingGroup(true);
    setError('');
    try {
      const conversation = await createGroupConversation(groupName.trim(), selectedUserIds);
      onClose();
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to create group conversation', err);
      setError('The group could not be created. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const filteredUsers = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/20 dark:bg-slate-950">
        <div className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 id="new-chat-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Start a new chat</h2>
            <p className="mt-1 text-sm text-slate-500">Start a private chat or create a group.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setMode('direct')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Direct chat</button>
            <button type="button" onClick={() => setMode('group')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'group' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Group chat</button>
          </div>
          {mode === 'group' && (
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={100} placeholder="Group name" className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
          )}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-400" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-4-4" /></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'group' ? 'Search people to add' : 'Search by name or email'} className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </div>
          {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        </div>

        <div className="max-h-80 overflow-y-auto border-t border-slate-100 p-3">
          {loading ? (
            <p className="p-6 text-center text-sm text-slate-500">Loading people...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No matching users found.</p>
          ) : filteredUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);
            return (
            <button type="button" key={user.id} onClick={() => mode === 'group' ? toggleGroupMember(user.id) : handleSelectUser(user.id)} disabled={creatingId !== null || creatingGroup} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition disabled:opacity-50 ${isSelected && mode === 'group' ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                {initials(user.name)}
                {user.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600">{mode === 'group' ? (isSelected ? 'Selected' : 'Add') : (creatingId === user.id ? 'Opening...' : 'Chat')}</span>
            </button>
          )})}
        </div>
        {mode === 'group' && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-sm text-slate-500">{selectedUserIds.length} selected</span>
            <button type="button" onClick={handleCreateGroup} disabled={creatingGroup || !groupName.trim() || selectedUserIds.length === 0} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {creatingGroup ? 'Creating...' : 'Create group'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
