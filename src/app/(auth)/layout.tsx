import { Plus_Jakarta_Sans } from 'next/font/google';

const authFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-auth',
});

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${authFont.variable} font-[family-name:var(--font-auth)]`}>{children}</div>;
}
