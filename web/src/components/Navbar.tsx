'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/loan', label: 'Loan Tool' },
  { href: '/tax', label: 'Tax Tool' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          {/* Put your logo at /web/public/scend-logo.png */}
          <Image src="/scend-logo.png" alt="Scend" width={36} height={36} className="rounded" />
          <span className="font-bold text-xl">Scend</span>
        </Link>
        <nav className="ml-auto flex gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-xl text-sm transition
                  ${active ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
