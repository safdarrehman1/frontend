'use client';

import { useEffect } from 'react';
import { Conversation, Message, User } from '../../types';

type Props = {
  conversation: Conversation | null;
  currentUser: User | null;
  messages: Message[];
  onClose: () => void;
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function ContactDetailsPanel({ conversation, currentUser, messages, onClose }: Props) {
  const isGroup = conversation?.type === 'group';
  const contact = conversation?.participants.find((participant) => participant.user_id !== currentUser?.id)?.user;
  const name = isGroup ? conversation?.name || 'Unnamed group' : contact?.name || 'Contact';
  const attachments = messages.filter((message) => !message.deleted_at && (message.message_type === 'image' || message.message_type === 'file'));
  const images = attachments.filter((message) => message.message_type === 'image');
  const files = attachments.filter((message) => message.message_type === 'file');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/30 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="contact-details-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="contact-details-panel themed-scrollbar flex h-dvh w-full max-w-[380px] flex-col overflow-y-auto border-l border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="sticky top-0 z-10 flex h-[73px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <button type="button" onClick={onClose} aria-label="Close contact details" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 id="contact-details-title" className="font-bold text-slate-900 dark:text-slate-100">{isGroup ? 'Group info' : 'Contact info'}</h2>
        </div>

        <section className="bg-white px-6 py-8 text-center dark:bg-slate-950">
          {contact?.avatar_url && !isGroup ? (
            <div role="img" aria-label={`${name}'s avatar`} style={{ backgroundImage: `url(${contact.avatar_url})` }} className="mx-auto h-28 w-28 rounded-full bg-cover bg-center shadow-lg" />
          ) : (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-200 dark:shadow-none">{initials(name)}</div>
          )}
          <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">{name}</h3>
          <p className={`mt-1 text-sm ${!isGroup && contact?.is_online ? 'font-medium text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
            {isGroup ? `${conversation?.participants.length || 0} participants` : contact?.is_online ? 'Online' : 'Offline'}
          </p>
        </section>

        {!isGroup && contact?.email && (
          <section className="mt-2 bg-white px-6 py-5 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact details</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M4 7l8 6 8-6" /></svg>
              </span>
              <div className="min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400">Email</p><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{contact.email}</p></div>
            </div>
          </section>
        )}

        <section className="mt-2 bg-white px-6 py-5 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Media and files</p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{attachments.length}</span>
          </div>
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {images.slice(0, 6).map((message) => (
                <a key={message.id} href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <span role="img" aria-label={message.file_name || 'Shared image'} style={{ backgroundImage: `url(http://localhost:5000${message.file_url})` }} className="block h-full w-full bg-cover bg-center transition hover:scale-105" />
                </a>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((message) => (
                <a key={message.id} href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" download={message.file_name || undefined} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5a2 2 0 002 2h5M5 3h9l7 7v11H5V3z" /></svg>
                  </span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{message.file_name || 'Shared file'}</span><span className="block text-xs text-slate-500 dark:text-slate-400">Open attachment</span></span>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                </a>
              ))}
            </div>
          )}
          {attachments.length === 0 && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No shared media or files yet.</p>}
        </section>

        {isGroup && (
          <section className="mt-2 bg-white px-4 py-5 dark:bg-slate-900">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{conversation?.participants.length || 0} participants</p>
            <div className="mt-3 space-y-1">
              {conversation?.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{initials(participant.user.name)}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{participant.user_id === currentUser?.id ? 'You' : participant.user.name}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{participant.user.email}</p></div>
                  {participant.is_admin && <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Admin</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
