'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchConversations } from '../lib/api/conversations';
import { useAuthStore } from '../store/authStore';
import { Conversation, User } from '../types';
import NewChatModal from './NewChatModal';

function initials(name?: string) {
  return (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getOtherUser(conversation: Conversation, currentUser?: User | null) {
  return conversation.participants.find((participant) => participant.user_id !== currentUser?.id)?.user;
}

export default function ConversationList() {
  const router = useRouter();
  const params = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');

  const loadConversations = async () => {
    try {
      setConversations(await fetchConversations());
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The request resolves asynchronously and updates the list when data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    loadConversations();
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const getConversationLabel = (conversation: Conversation) => {
    if (conversation.type === 'group') return conversation.name || 'Unnamed group';
    return getOtherUser(conversation, currentUser)?.name || 'Unknown user';
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return 'No messages yet';
    return lastMessage.content.length > 42 ? `${lastMessage.content.slice(0, 42)}…` : lastMessage.content;
  };

  const filteredConversations = conversations.filter((conversation) =>
    getConversationLabel(conversation).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <aside className={`${params?.conversationId ? 'hidden md:flex' : 'flex'} h-dvh w-full shrink-0 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 md:w-[380px]`}>
      <div className="border-b border-slate-100 px-5 pb-4 pt-5 transition-colors dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,.1)]" /><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Messages</p></div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">Conversations</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:shadow-none"
          >
            <span className="text-xl font-light leading-none">+</span> New chat
          </button>
        </div>
        <div className="mt-4 flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-blue-500 dark:focus-within:bg-slate-900 dark:focus-within:ring-blue-500/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-4-4" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200">×</button>}
        </div>
      </div>

      <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="space-y-3 p-2" aria-label="Loading conversations">
            {[1, 2, 3].map((item) => <div key={item} className="h-18 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="mx-2 mt-8 rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{query ? 'No matching conversations' : 'No conversations yet'}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{query ? 'Try a different name.' : 'Start a new chat and say hello.'}</p>
          </div>
        ) : filteredConversations.map((conversation) => {
          const isActive = params?.conversationId === String(conversation.id);
          const otherUser = getOtherUser(conversation, currentUser);
          const label = getConversationLabel(conversation);
          const isGroup = conversation.type === 'group';

          return (
            <button
              type="button"
              key={conversation.id}
              onClick={() => router.push(`/chat/${conversation.id}`)}
              className={`chat-list-item group mb-1.5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${isActive ? 'bg-blue-50 shadow-sm ring-1 ring-blue-100 dark:bg-blue-500/15 dark:ring-blue-400/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <div className="relative shrink-0">
                {!isGroup && otherUser?.avatar_url ? (
                  <div role="img" aria-label={`${label}'s avatar`} style={{ backgroundImage: `url(${otherUser.avatar_url})` }} className="h-12 w-12 rounded-2xl bg-cover bg-center shadow-sm ring-1 ring-black/5" />
                ) : (
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition group-hover:scale-[1.03] ${isActive ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {initials(label)}
                  </div>
                )}
                {!isGroup && otherUser?.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                  {isGroup
                    ? <span className="text-[11px] font-medium text-slate-400">{conversation.participants.length} members</span>
                    : otherUser?.is_online && <span className="text-[11px] font-medium text-emerald-600">Online</span>}
                </div>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{getLastMessagePreview(conversation)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-white/90 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-bold text-white shadow-sm">
            {initials(currentUser?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser?.name || 'Your account'}</p>
            <p className="truncate text-xs text-slate-500">{currentUser?.email || 'Signed in'}</p>
          </div>
          <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 8l4 4m0 0l-4 4m4-4H9m3 7H5a2 2 0 01-2-2V7a2 2 0 012-2h7" /></svg>
          </button>
        </div>
      </div>

      {showModal && <NewChatModal onClose={handleModalClose} />}
    </aside>
  );
}
