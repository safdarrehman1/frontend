'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import { fetchConversations } from '../../../lib/api/conversations';
import { getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../store/authStore';
import { ApiResponse, Conversation, Message } from '../../../types';
import ChatHeader from '../../../components/chat/ChatHeader';
import MessageBubble from '../../../components/chat/MessageBubble';
import ContactDetailsPanel from '../../../components/chat/ContactDetailsPanel';

type SelectedFile = {
  file: File;
  previewUrl: string | null;
};

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.conversationId as string;
  const currentUser = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const [res, conversations] = await Promise.all([
          api.get<ApiResponse<{ messages: Message[] }>>(`/conversations/${conversationId}/messages`),
          fetchConversations(),
        ]);
        setMessages(res.data.data.messages);
        setConversation(conversations.find((item) => String(item.id) === conversationId) || null);
        await api.post(`/conversations/${conversationId}/messages/delivered`);
        if (document.visibilityState === 'visible') await api.post(`/conversations/${conversationId}/messages/read`);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message: Message) => {
      if (String(message.conversation_id) === conversationId) {
        setMessages((prev) => [...prev, message]);
        if (message.sender_id !== currentUser?.id) {
          api.post(`/conversations/${conversationId}/messages/delivered`)
            .then(() => document.visibilityState === 'visible' ? api.post(`/conversations/${conversationId}/messages/read`) : undefined)
            .catch((err) => console.error('Failed to update message receipt', err));
        }
      }
    };

    const handleMessagesRead = (data: { conversationId: number; messageIds: number[]; readAt: string }) => {
      if (String(data.conversationId) !== conversationId) return;
      const readIds = new Set(data.messageIds);
      setMessages((prev) => prev.map((message) =>
        readIds.has(message.id) ? { ...message, read_at: data.readAt } : message
      ));
    };

    const handleMessageSeen = (data: { conversationId: number; messageIds: number[]; userId: number; seenAt: string }) => {
      if (String(data.conversationId) !== conversationId) return;
      const ids = new Set(data.messageIds);
      setMessages((current) => current.map((message) => ids.has(message.id) ? {
        ...message,
        receipts: [...(message.receipts || []).filter((receipt) => receipt.user_id !== data.userId), { user_id: data.userId, delivered_at: data.seenAt, seen_at: data.seenAt }]
      } : message));
    };

    const handleMessageDelivered = (data: { conversationId: number; messageIds: number[]; userId: number; deliveredAt: string }) => {
      if (String(data.conversationId) !== conversationId) return;
      const ids = new Set(data.messageIds);
      setMessages((current) => current.map((message) => ids.has(message.id) ? {
        ...message,
        receipts: [...(message.receipts || []).filter((receipt) => receipt.user_id !== data.userId), { user_id: data.userId, delivered_at: data.deliveredAt, seen_at: (message.receipts || []).find((receipt) => receipt.user_id === data.userId)?.seen_at || null }]
      } : message));
    };

    const handleUpdated = (message: Message) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, content: message.content, is_edited: message.is_edited, updatedAt: message.updatedAt } : item));
    const handleReactions = (message: Message) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, reactions: message.reactions } : item));
    const handleDeleted = (data: { messageId: number; deletedAt: string }) => setMessages((current) => current.map((item) => item.id === data.messageId ? { ...item, content: '', deleted_at: data.deletedAt } : item));
    const handlePin = (data: { messageId: number; pinned: boolean }) => setMessages((current) => current.map((item) => item.id === data.messageId ? { ...item, pins: data.pinned ? [{ id: 0, pinned_by: 0 }] : [] } : item));

    const handleTyping = (data: { userId: number; conversationId: string; isTyping: boolean }) => {
      if (String(data.conversationId) === conversationId && data.userId !== currentUser?.id) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message:seen', handleMessageSeen);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message_updated', handleUpdated);
    socket.on('message_deleted', handleDeleted);
    socket.on('message_reactions_updated', handleReactions);
    socket.on('message_pin_updated', handlePin);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message:seen', handleMessageSeen);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message_updated', handleUpdated);
      socket.off('message_deleted', handleDeleted);
      socket.off('message_reactions_updated', handleReactions);
      socket.off('message_pin_updated', handlePin);
    };
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const markVisibleMessagesSeen = () => {
      if (document.visibilityState === 'visible') {
        api.post(`/conversations/${conversationId}/messages/read`).catch((err) => console.error('Failed to mark messages as seen', err));
      }
    };
    document.addEventListener('visibilitychange', markVisibleMessagesSeen);
    return () => document.removeEventListener('visibilitychange', markVisibleMessagesSeen);
  }, [conversationId]);

  useEffect(() => {
    if (!search.trim()) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<ApiResponse<{ messages: Message[] }>>(`/conversations/${conversationId}/messages/search`, { params: { q: search.trim() } });
        setSearchResults(res.data.data.messages);
      } catch (err) { console.error('Failed to search messages', err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [conversationId, search]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (editingMessage) {
        await api.patch(`/conversations/${conversationId}/messages/${editingMessage.id}`, { content: newMessage });
      } else {
        await api.post(`/conversations/${conversationId}/messages`, { content: newMessage, replyToMessageId: replyingTo?.id });
      }
      setNewMessage('');
      setEditingMessage(null);
      setReplyingTo(null);
      emitTyping(false);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadError('');
    setSelectedFiles((current) => {
      const availableSlots = Math.max(0, 10 - current.length);
      const additions = files.slice(0, availableSlots).map((file) => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      return [...current, ...additions];
    });
    event.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((current) => {
      const item = current[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const closeFilePreview = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    setUploadError('');
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadError('');
    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(({ file }) => formData.append('files', file));
      await api.post(`/conversations/${conversationId}/messages/upload`, formData);
      closeFilePreview();
    } catch (err) {
      console.error('Failed to upload file', err);
      setUploadError('The selected files could not be sent. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const emitTyping = (isTyping: boolean) => {
    const socket = getSocket();
    socket?.emit('typing', { conversationId, isTyping });
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    emitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 2000);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyingTo(null);
    setNewMessage(message.content);
  };

  const handleDelete = async (message: Message) => {
    if (!window.confirm('Delete this message?')) return;
    try { await api.delete(`/conversations/${conversationId}/messages/${message.id}`); }
    catch (err) { console.error('Failed to delete message', err); }
  };

  const handleReact = async (message: Message, emoji: string) => {
    try { await api.post(`/conversations/${conversationId}/messages/${message.id}/reactions`, { emoji }); }
    catch (err) { console.error('Failed to update reaction', err); }
  };

  const handlePin = async (message: Message) => {
    try { await api.post(`/conversations/${conversationId}/messages/${message.id}/pin`); }
    catch (err) { console.error('Failed to update pin', err); }
  };

  const handleStar = async (message: Message) => {
    try {
      const res = await api.post<ApiResponse<{ messageId: number; starred: boolean }>>(`/conversations/${conversationId}/messages/${message.id}/star`);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, stars: res.data.data.starred ? [{ id: 0, user_id: currentUser?.id || 0 }] : [] } : item));
    } catch (err) { console.error('Failed to update star', err); }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find((participant) => participant.user_id !== currentUser?.id)?.user;
  const otherSender = messages.find((message) => message.sender_id !== currentUser?.id)?.sender;
  const isGroup = conversation?.type === 'group';
  const conversationName = isGroup
    ? conversation?.name || 'Unnamed group'
    : otherParticipant?.name || otherSender?.name || 'Conversation';
  const conversationInitials = conversationName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const typingParticipant = conversation?.participants.find((participant) => participant.user_id === typingUser)?.user;
  const displayedMessages = (searchResults || messages).filter((message) =>
    (!showPinned || Boolean(message.pins?.length)) && (!showStarred || Boolean(message.stars?.length))
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <ChatHeader conversation={conversation} name={conversationName} initials={conversationInitials} search={search} showPinned={showPinned} showStarred={showStarred} onBack={() => router.push('/chat')} onSearch={(value) => { setSearch(value); if (!value.trim()) setSearchResults(null); }} onTogglePinned={() => setShowPinned((value) => !value)} onToggleStarred={() => setShowStarred((value) => !value)} onOpenDetails={() => setShowDetails(true)} isOnline={otherParticipant?.is_online} lastSeenAt={otherParticipant?.last_seen_at} />

      {showDetails && <ContactDetailsPanel conversation={conversation} currentUser={currentUser} messages={messages} onClose={() => setShowDetails(false)} />}

      <div className="chat-canvas themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-8 lg:px-12">
        {displayedMessages.length === 0 && (
          <div className="chat-empty-state mx-auto mt-12 max-w-sm rounded-3xl border border-slate-200/70 bg-white/80 px-8 py-9 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="chat-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" /></svg>
            </div>
            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">Start the conversation</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send a message below to say hello.</p>
          </div>
        )}
        {displayedMessages.map((message) => (
          <MessageBubble key={message.id} message={message} currentUserId={currentUser?.id} recipientCount={Math.max(0, (conversation?.participants.length || 1) - 1)} onReply={(item) => { setReplyingTo(item); setEditingMessage(null); }} onEdit={handleEdit} onDelete={handleDelete} onReact={handleReact} onPin={handlePin} onStar={handleStar} />
        ))}

        {typingUser && (
          <p className="ml-2 text-xs font-medium text-slate-400">{typingParticipant?.name || 'Someone'} is typing…</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title">
          <div className="chat-modal flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h2 id="attachment-preview-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Review attachments</h2>
                <p className="text-sm text-slate-500">{selectedFiles.length} of 10 selected</p>
              </div>
              <button type="button" onClick={closeFilePreview} disabled={uploading} aria-label="Close preview" className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedFiles.map((item, index) => (
                  <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                    {item.previewUrl ? (
                      <div style={{ backgroundImage: `url(${item.previewUrl})` }} role="img" aria-label={item.file.name} className="aspect-square bg-contain bg-center bg-no-repeat" />
                    ) : (
                      <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5a2 2 0 002 2h5M5 3h9l7 7v11H5V3z" /></svg>
                        <span className="line-clamp-2 text-xs font-medium">{item.file.name}</span>
                      </div>
                    )}
                    <button type="button" onClick={() => removeSelectedFile(index)} disabled={uploading} aria-label={`Remove ${item.file.name}`} className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-1.5 text-white shadow transition hover:bg-rose-600 disabled:opacity-50">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                ))}
                {selectedFiles.length < 10 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                    <span className="text-3xl font-light">+</span>
                    Add more
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
              {uploadError && <p className="mb-3 text-sm font-medium text-rose-600">{uploadError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeFilePreview} disabled={uploading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button type="button" onClick={handleFileUpload} disabled={uploading || selectedFiles.length === 0} className="flex min-w-28 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                  {uploading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {uploading ? 'Sending...' : `Send ${selectedFiles.length}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(replyingTo || editingMessage) && (
        <div className="mx-3 flex items-center justify-between rounded-t-2xl border border-b-0 border-blue-100 bg-blue-50 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 sm:mx-4">
          <div className="min-w-0"><strong className="text-blue-700 dark:text-blue-400">{editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender.name}`}</strong><p className="truncate text-slate-500">{editingMessage?.content || replyingTo?.content}</p></div>
          <button type="button" onClick={() => { setReplyingTo(null); setEditingMessage(null); if (editingMessage) setNewMessage(''); }} className="ml-3 rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800">✕</button>
        </div>
      )}
      <form onSubmit={handleSend} className="relative m-3 mt-0 flex shrink-0 gap-2 rounded-[1.35rem] border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:m-4 sm:mt-0 sm:gap-3 sm:p-2.5">
        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelection} accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.txt,.zip" className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Attach a file" title="Attach a file" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 11.5l-8.7 8.7a6 6 0 01-8.5-8.5l9.4-9.4a4 4 0 015.7 5.7l-9.5 9.5a2 2 0 01-2.8-2.8l8.8-8.8" /></svg>
          )}
        </button>
        <div className="flex min-w-0 flex-1 items-center rounded-2xl bg-slate-50 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 dark:bg-slate-800 dark:focus-within:bg-slate-800 dark:focus-within:ring-blue-500/15">
          <input type="text" value={newMessage} onChange={(e) => handleInputChange(e.target.value)} placeholder={editingMessage ? 'Edit your message...' : replyingTo ? 'Write a reply...' : 'Write a message...'} className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none dark:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-400 sm:w-auto sm:px-5"
        >
          <span className="hidden text-sm font-semibold sm:block">Send</span>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 sm:ml-2" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12L3 4l18 8-18 8 2-8zm0 0h9" /></svg>
        </button>
      </form>
    </section>
  );
}
