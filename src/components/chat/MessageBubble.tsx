'use client';

import { Message } from '../../types';

const emojis = ['👍', '❤️', '😂', '😮', '😢'];

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

  return (
    <div id={`message-${message.id}`} className={`group/message mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[82%] sm:max-w-lg">
        <div className={`rounded-2xl text-sm leading-6 ${isDeleted ? 'border border-slate-200 bg-slate-100 px-4 py-3 italic text-slate-500 dark:border-slate-700 dark:bg-slate-800' : isAttachment ? 'bg-transparent' : isOwn ? 'rounded-br-md bg-blue-600 px-4 py-3 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
          {!isOwn && <p className="mb-0.5 text-xs font-semibold text-blue-500">{message.sender.name}</p>}
          {message.replyTo && (
            <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${isOwn ? 'border-blue-200 bg-blue-500/40' : 'border-blue-500 bg-slate-100 dark:bg-slate-800'}`}>
              <strong>{message.replyTo.sender.name}</strong>
              <p className="truncate">{message.replyTo.deleted_at ? 'Deleted message' : message.replyTo.content || message.replyTo.file_name}</p>
            </div>
          )}
          {isDeleted ? <p>Message deleted</p> : message.message_type === 'image' && message.file_url ? (
            <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer"><span role="img" aria-label={message.file_name || 'Shared image'} style={{ backgroundImage: `url(http://localhost:5000${message.file_url})` }} className="block h-60 w-[min(320px,75vw)] rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat shadow-sm" /></a>
          ) : message.message_type === 'file' && message.file_url ? (
            <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" download={message.file_name || undefined} className="flex w-[min(340px,75vw)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><span className="text-2xl">📄</span><span className="min-w-0"><span className="block truncate font-semibold">{message.file_name || 'Download file'}</span><span className="block text-xs text-slate-500">Open attachment</span></span></a>
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
            {reactions.map((reaction) => <button type="button" key={reaction.emoji} onClick={() => onReact(message, reaction.emoji)} className={`rounded-full border px-2 py-0.5 text-xs ${reaction.mine ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>{reaction.emoji} {reaction.count}</button>)}
            <details className="relative"><summary className="cursor-pointer list-none rounded-full px-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">＋</summary><div className="absolute bottom-7 z-10 flex rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => onReact(message, emoji)} className="p-1 hover:scale-125">{emoji}</button>)}</div></details>
            <button type="button" onClick={() => onReply(message)} className="text-xs text-slate-400 hover:text-blue-600">Reply</button>
            {isOwn && message.message_type === 'text' && <button type="button" onClick={() => onEdit(message)} className="text-xs text-slate-400 hover:text-blue-600">Edit</button>}
            {isOwn && <button type="button" onClick={() => onDelete(message)} className="text-xs text-slate-400 hover:text-rose-600">Delete</button>}
            <button type="button" onClick={() => onPin(message)} className="text-xs text-slate-400 hover:text-amber-600">{message.pins?.length ? 'Unpin' : 'Pin'}</button>
            <button type="button" onClick={() => onStar(message)} className="text-xs text-slate-400 hover:text-amber-600">{message.stars?.length ? 'Unstar' : 'Star'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
