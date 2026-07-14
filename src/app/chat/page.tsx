'use client';

export default function ChatPage() {
  return (
    <section className="chat-canvas relative hidden flex-1 items-center justify-center overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950 md:flex">
      <div className="absolute left-[15%] top-[18%] h-72 w-72 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/5" />
      <div className="absolute bottom-[12%] right-[12%] h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl dark:bg-cyan-500/5" />
      <div className="chat-empty-state relative max-w-md rounded-[2rem] border border-white/70 bg-white/75 px-10 py-12 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none">
        <div className="chat-empty-icon mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-200 dark:shadow-none">
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Ready when you are</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Your conversations</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a conversation from the sidebar or start a new chat to connect with someone.</p>
      </div>
    </section>
  );
}
