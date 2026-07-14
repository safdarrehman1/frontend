'use client';

import { useRef, useState } from 'react';
import { Message } from '../../types';

const emojis = ['👍', '❤️', '😂', '😮', '😢'];
const moreEmojis = ['🙏', '👏', '🔥', '🎉', '😍', '🤔', '😆', '😡', '💯', '✅'];

type Props = {
  message: Message;
  currentUserId?: number;
  recipientCount: number;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  onPin: (message: Message) => void;
  onStar: (message: Message) => void;
};

export default function MessageBubble({ message, currentUserId, recipientCount, onReply, onEdit, onDelete, onReact, onPin, onStar }: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const reactionsRef = useRef<HTMLDetailsElement>(null);
  const [quickEmojis, setQuickEmojis] = useState(emojis);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const isOwn = message.sender_id === currentUserId;
  const isAttachment = message.message_type === 'image' || message.message_type === 'file';
  const isDeleted = Boolean(message.deleted_at);
  const reactions = Object.values((message.reactions || []).reduce<Record<string, { emoji: string; count: number; mine: boolean }>>((groups, reaction) => {
    const group = groups[reaction.emoji] || { emoji: reaction.emoji, count: 0, mine: false };
    group.count += 1;
    group.mine ||= reaction.user_id === currentUserId;
    groups[reaction.emoji] = group;
    return groups;
  }, {}));
  const receipts = message.receipts || [];
  const seenCount = receipts.filter((receipt) => receipt.seen_at).length;
  const deliveredCount = receipts.filter((receipt) => receipt.delivered_at).length;
  const status = seenCount >= recipientCount && recipientCount > 0 ? 'Seen' : deliveredCount > 0 ? 'Delivered' : 'Sent';
  const runAction = (action: () => void) => {
    action();
    menuRef.current?.removeAttribute('open');
  };
  const runReaction = (emoji: string) => {
    onReact(message, emoji);
    setShowMoreEmojis(false);
    reactionsRef.current?.removeAttribute('open');
  };
  const chooseMoreReaction = (emoji: string) => {
    setQuickEmojis((current) => [emoji, ...current.filter((item) => item !== emoji)].slice(0, 5));
    runReaction(emoji);
  };

  return (
    <div id={`message-${message.id}`} className={`chat-message group/message mb-3.5 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[82%] sm:max-w-xl">
        <div className={`rounded-[1.15rem] text-sm leading-5 ${isDeleted ? 'border border-slate-200 bg-slate-100 px-3.5 py-2 italic text-slate-500 dark:border-slate-700 dark:bg-slate-800' : isAttachment ? 'bg-transparent' : isOwn ? 'rounded-br-[.35rem] bg-gradient-to-br from-blue-600 to-blue-700 px-3.5 py-2.5 text-white shadow-md shadow-blue-200/70 dark:shadow-none' : 'rounded-bl-[.35rem] border border-slate-200/70 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
          {!isOwn && <p className="mb-0.5 text-xs font-semibold text-blue-500">{message.sender.name}</p>}
          {message.replyTo && (
            <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${isOwn ? 'border-blue-200 bg-blue-500/40' : 'border-blue-500 bg-slate-100 dark:bg-slate-800'}`}>
              <strong>{message.replyTo.sender.name}</strong>
              <p className="truncate">{message.replyTo.deleted_at ? 'Deleted message' : message.replyTo.content || message.replyTo.file_name}</p>
            </div>
          )}
          {isDeleted ? <p>Message deleted</p> : message.message_type === 'image' && message.file_url ? (
            <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer"><span role="img" aria-label={message.file_name || 'Shared image'} style={{ backgroundImage: `url(http://localhost:5000${message.file_url})` }} className="block h-60 w-[min(320px,75vw)] rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat shadow-sm dark:border-slate-700 dark:bg-slate-900" /></a>
          ) : message.message_type === 'file' && message.file_url ? (
            <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" download={message.file_name || undefined} className="flex w-[min(340px,75vw)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl dark:bg-violet-500/10">📄</span><span className="min-w-0"><span className="block truncate font-semibold">{message.file_name || 'Download file'}</span><span className="block text-xs text-slate-500">Open attachment</span></span></a>
          ) : <p className="break-words">{message.content}</p>}
          <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOwn && !isAttachment && !isDeleted ? 'text-blue-100' : 'text-slate-400'}`}>
            {message.is_edited && !isDeleted && <span>edited ·</span>}
            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {message.pins?.length ? <span title="Pinned">📌</span> : null}
            {message.stars?.length ? <span title="Starred">★</span> : null}
            {isOwn && <span title={status} aria-label={status} className={status === 'Seen' ? 'text-cyan-300' : ''}>{status === 'Sent' ? '✓' : '✓✓'}</span>}
          </p>
        </div>
        {!isDeleted && (
          <div className={`mt-1 flex flex-wrap items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {reactions.map((reaction) => <button type="button" key={reaction.emoji} onClick={() => onReact(message, reaction.emoji)} className={`rounded-full border px-2 py-0.5 text-xs transition hover:-translate-y-0.5 ${reaction.mine ? 'border-blue-300 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-200' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>{reaction.emoji} {reaction.count}</button>)}
          </div>
        )}

        {!isDeleted && (
          <div className={`message-controls absolute inset-x-0 top-0 z-20 flex items-center gap-0.5 opacity-100 transition md:opacity-0 md:group-hover/message:opacity-100 ${isOwn ? 'justify-start' : 'justify-end'}`}>
            <details ref={reactionsRef} name="message-actions" className="group/reactions static md:group-open/reactions:opacity-100">
              <summary aria-label="React to message" title="React to message" className={`flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 group-open/reactions:bg-slate-200 group-open/reactions:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:group-open/reactions:bg-slate-800 dark:group-open/reactions:text-slate-200 ${isOwn ? '-translate-x-[4.25rem]' : 'translate-x-[4.25rem]'}`}>
                <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M8.5 10h.01M15.5 10h.01M8.5 14.5c1.8 1.7 5.2 1.7 7 0" /></svg>
              </summary>
              <div className={`message-reaction-picker absolute top-9 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 ${isOwn ? 'right-0' : 'left-0'}`}>
                {quickEmojis.map((emoji) => <button type="button" key={emoji} onClick={() => runReaction(emoji)} className="flex h-8 w-8 items-center justify-center rounded-full text-xl transition hover:-translate-y-1 hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-800">{emoji}</button>)}
                <button type="button" onClick={() => setShowMoreEmojis((value) => !value)} aria-label="More reactions" title="More reactions" className="flex h-8 w-8 items-center justify-center rounded-full text-2xl font-light text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">+</button>
                {showMoreEmojis && (
                  <div className={`message-more-reactions absolute top-12 grid w-44 grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 ${isOwn ? 'right-0' : 'left-0'}`}>
                    {[...emojis, ...moreEmojis].filter((emoji) => !quickEmojis.includes(emoji)).map((emoji) => (
                      <button type="button" key={emoji} onClick={() => chooseMoreReaction(emoji)} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-800">{emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </details>

            <details ref={menuRef} name="message-actions" className="group/menu static md:group-open/menu:opacity-100">
              <summary aria-label="Message options" title="Message options" className={`flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 group-open/menu:bg-slate-200 group-open/menu:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:group-open/menu:bg-slate-800 dark:group-open/menu:text-slate-200 ${isOwn ? '-translate-x-[4.25rem]' : 'translate-x-[4.25rem]'}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
              </summary>
              <div className={`chat-options-menu absolute top-9 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 ${isOwn ? 'right-0' : 'left-0'}`}>
              <button type="button" onClick={() => runAction(() => onReply(message))} className="message-menu-item"><span>↩</span><span>Reply</span></button>
              {isOwn && message.message_type === 'text' && <button type="button" onClick={() => runAction(() => onEdit(message))} className="message-menu-item"><span>✎</span><span>Edit</span></button>}
              <button type="button" onClick={() => runAction(() => onPin(message))} className="message-menu-item"><span>📌</span><span>{message.pins?.length ? 'Unpin' : 'Pin'}</span></button>
              <button type="button" onClick={() => runAction(() => onStar(message))} className="message-menu-item"><span>★</span><span>{message.stars?.length ? 'Unstar' : 'Star'}</span></button>
              {isOwn && <><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" onClick={() => runAction(() => onDelete(message))} className="message-menu-item text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><span>⌫</span><span>Delete</span></button></>}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
