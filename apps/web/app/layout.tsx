import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEET Master Tracker Pro',
  description: 'A local-first NEET UG 2026 preparation operating system.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
