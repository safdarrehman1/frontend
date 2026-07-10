'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import { getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../store/authStore';
import { ApiResponse, Message } from '../../../types';

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
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<{ messages: Message[] }>>(
          `/conversations/${conversationId}/messages`
        );
        setMessages(res.data.data.messages);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message: Message) => {
      if (String(message.conversation_id) === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (data: { userId: number; conversationId: string; isTyping: boolean }) => {
      if (String(data.conversationId) === conversationId && data.userId !== currentUser?.id) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/conversations/${conversationId}/messages`, {
        content: newMessage,
      });
      setNewMessage('');
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const otherSender = messages.find((message) => message.sender_id !== currentUser?.id)?.sender;
  const conversationName = otherSender?.name || 'Conversation';
  const conversationInitials = conversationName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-[73px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <button type="button" onClick={() => router.push('/chat')} aria-label="Back to chats" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 md:hidden">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">{conversationInitials}</div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold text-slate-900">{conversationName}</h1>
          <p className="text-xs font-medium text-emerald-600">Active conversation</p>
        </div>
        <div className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">Private chat</div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && (
          <div className="mx-auto mt-12 max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" /></svg>
            </div>
            <p className="mt-4 font-semibold text-slate-700">Start the conversation</p>
            <p className="mt-1 text-sm text-slate-500">Send a message below to say hello.</p>
          </div>
        )}
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUser?.id;
          const isAttachment = message.message_type === 'image' || message.message_type === 'file';
          return (
            <div
              key={message.id}
              className={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl text-sm leading-6 sm:max-w-lg ${
                  isAttachment
                    ? 'bg-transparent p-0 text-slate-800'
                    : isOwnMessage
                    ? 'rounded-br-md bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-slate-800 shadow-sm'
                }`}
              >
                {!isOwnMessage && (
                  <p className="mb-0.5 text-xs font-semibold text-blue-600">
                    {message.sender.name}
                  </p>
                )}
                {message.message_type === 'image' && message.file_url ? (
                  <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" className="block">
                    <span role="img" aria-label={message.file_name || 'Shared image'} style={{ backgroundImage: `url(http://localhost:5000${message.file_url})` }} className="block h-60 w-[min(320px,75vw)] rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat shadow-sm" />
                  </a>
                ) : message.message_type === 'file' && message.file_url ? (
                  <a href={`http://localhost:5000${message.file_url}`} target="_blank" rel="noreferrer" download={message.file_name || undefined} className="flex w-[min(340px,75vw)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-sm transition hover:bg-slate-50">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5a2 2 0 002 2h5M5 3h9l7 7v11H5V3z" /></svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{message.file_name || 'Download file'}</span>
                      <span className="block text-xs text-slate-500">Open attachment</span>
                    </span>
                  </a>
                ) : (
                  <p className="break-words">{message.content}</p>
                )}
                <p className={`mt-1 text-right text-[10px] ${isOwnMessage && !isAttachment ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <p className="ml-2 text-xs font-medium text-slate-400">Someone is typing…</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="attachment-preview-title" className="text-lg font-bold text-slate-900">Review attachments</h2>
                <p className="text-sm text-slate-500">{selectedFiles.length} of 10 selected</p>
              </div>
              <button type="button" onClick={closeFilePreview} disabled={uploading} aria-label="Close preview" className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedFiles.map((item, index) => (
                  <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {item.previewUrl ? (
                      <div style={{ backgroundImage: `url(${item.previewUrl})` }} role="img" aria-label={item.file.name} className="aspect-square bg-contain bg-center bg-no-repeat" />
                    ) : (
                      <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center text-slate-500">
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
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                    <span className="text-3xl font-light">+</span>
                    Add more
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-4 sm:px-6">
              {uploadError && <p className="mb-3 text-sm font-medium text-rose-600">{uploadError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeFilePreview} disabled={uploading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleFileUpload} disabled={uploading || selectedFiles.length === 0} className="flex min-w-28 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                  {uploading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {uploading ? 'Sending...' : `Send ${selectedFiles.length}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex shrink-0 gap-3 border-t border-slate-200 bg-white p-3 sm:p-4">
        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelection} accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.txt,.zip" className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Attach a file" title="Attach a file" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60">
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 11.5l-8.7 8.7a6 6 0 01-8.5-8.5l9.4-9.4a4 4 0 015.7 5.7l-9.5 9.5a2 2 0 01-2.8-2.8l8.8-8.8" /></svg>
          )}
        </button>
        <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
          <input type="text" value={newMessage} onChange={(e) => handleInputChange(e.target.value)} placeholder="Write a message..." className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:px-5"
        >
          <span className="hidden text-sm font-semibold sm:block">Send</span>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 sm:ml-2" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12L3 4l18 8-18 8 2-8zm0 0h9" /></svg>
        </button>
      </form>
    </section>
  );
}
