'use client';

export default function ChatPage() {
  return (
    <section className="hidden flex-1 items-center justify-center bg-slate-50 md:flex">
      <div className="max-w-sm px-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200">
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.6 9.6 0 01-4.1-.9L3 21l.9-4.9A9.6 9.6 0 013 12a9 9 0 1118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your conversations</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Choose a conversation from the sidebar or start a new chat to connect with someone.</p>
      </div>
    </section>
  );
}
