'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { ApiResponse, User } from '../../../types';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
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
        '/auth/register',
        { name, email, password }
      );

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.push('/chat');
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Registration failed' : 'Registration failed');
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
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">A better way to stay connected</p>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-6xl">Your next conversation starts here.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Create your account and step into a focused space built for fast messages, effortless sharing, and genuine connection.</p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[['01', 'Create'], ['02', 'Connect'], ['03', 'Chat']].map(([step, label]) => (
              <div key={step} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-semibold text-cyan-300">{step}</p><p className="mt-2 text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/95 p-7 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-9 lg:max-w-none">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          <div className="mb-6">
            <div className="auth-logo mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" /></svg>
            </div>
            <p className="text-sm font-semibold text-blue-600">Get started</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Create your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">It only takes a moment to join the conversation.</p>
          </div>

          {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"><span className="mt-0.5">!</span><span>{error}</span></div>}

          <form onSubmit={handleSubmit} className="auth-form space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <svg viewBox="0 0 24 24" fill="none" className="mr-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 21a8 8 0 0116 0" /></svg>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" autoComplete="name" className="h-11 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <svg viewBox="0 0 24 24" fill="none" className="mr-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M4 7l8 6 8-6" /></svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className="h-11 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <svg viewBox="0 0 24 24" fill="none" className="mr-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 10V7a4 4 0 018 0v3" /></svg>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" className="h-11 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Use at least 8 characters for a secure password.</p>
            </div>

            <button type="submit" disabled={loading} className="auth-submit mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Already registered?</span><span className="h-px flex-1 bg-slate-200" /></div>
          <p className="text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-blue-600 transition hover:text-blue-700">Sign in</Link></p>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">By creating an account, you agree to use Chat System responsibly and securely.</p>
        </section>
      </div>
    </main>
  );
}
