'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { ApiResponse, User } from '../../../types';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>(
        '/auth/login',
        { email, password }
      );

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.push('/chat');
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Login failed' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell login-background relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-950/30 to-slate-950/75" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_480px]">
        <section className="login-intro hidden max-w-2xl text-white lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" /></svg>
            </div>
            <div><p className="font-bold tracking-tight">Chat System</p><p className="text-xs text-blue-200">Connect. Share. Stay close.</p></div>
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Your conversations, everywhere</p>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-6xl">Meaningful conversations, beautifully connected.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">A focused space for instant messages, shared moments, and the people who matter—available whenever you need it.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {['Real-time messaging', 'Secure sessions', 'File sharing'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-slate-100 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />{feature}
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/95 p-7 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-10 lg:max-w-none">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          <div className="mb-8">
            <div className="auth-logo mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" /></svg>
            </div>
            <p className="text-sm font-semibold text-blue-600">Welcome back</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Enter your details to continue your conversations.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <span className="mt-0.5">!</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <svg viewBox="0 0 24 24" fill="none" className="mr-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M4 7l8 6 8-6" /></svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className="h-12 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <svg viewBox="0 0 24 24" fill="none" className="mr-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 10V7a4 4 0 018 0v3" /></svg>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" autoComplete="current-password" className="h-12 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New here?</span><span className="h-px flex-1 bg-slate-200" /></div>
          <p className="text-center text-sm text-slate-500">Don&apos;t have an account? <Link href="/register" className="font-semibold text-blue-600 transition hover:text-blue-700">Create an account</Link></p>
          <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">By continuing, you agree to use Chat System responsibly and securely.</p>
        </section>
      </div>
    </main>
  );
}
