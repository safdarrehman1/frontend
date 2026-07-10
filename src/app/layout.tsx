import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chat System',
  description: 'Real-time chat application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
