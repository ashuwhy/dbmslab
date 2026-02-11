'use client';

import { usePathname } from 'next/navigation';

export default function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullBleed =
    pathname === '/' ||
    pathname === '/login' ||
    pathname?.startsWith('/signup');
  return (
    <div
      className={isFullBleed ? '' : 'mx-auto max-w-5xl px-6 py-8'}
    >
      {children}
    </div>
  );
}
