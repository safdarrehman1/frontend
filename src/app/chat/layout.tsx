'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import api from '../../lib/axios';
import { ApiResponse, User } from '../../types';
import ConversationList from '@/src/components/ConversationList';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!accessToken) {
        try {
          const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
          const meRes = await api.get<ApiResponse<{ user: User }>>('/auth/me', {
            headers: { Authorization: `Bearer ${res.data.data.accessToken}` },
          });
          setAuth(meRes.data.data.user, res.data.data.accessToken);
        } catch {
          clearAuth();
          router.push('/login');
          return;
        }
      }
      setChecking(false);
    };

    restoreSession();
  }, [accessToken, clearAuth, router, setAuth]);

  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    }
    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-slate-100">
      <ConversationList />
      {children}
    </main>
  );
}
