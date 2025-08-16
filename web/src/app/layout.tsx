import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/src/components/Navbar';

export const metadata: Metadata = {
  title: 'Scend • Digital-first services',
  description: 'Financial tools, services, and more by Scend.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
