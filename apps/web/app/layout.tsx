import type { Metadata } from 'next';
import './globals.css';
import NavbarWrapper from './components/NavbarWrapper';
import MainContentWrapper from './components/MainContentWrapper';

export const metadata: Metadata = {
  title: 'Index Corruption Intitude',
  description: 'University Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`bg-[#09090b] text-zinc-100 min-h-screen`}>
        <NavbarWrapper />
        <main>
          <MainContentWrapper>{children}</MainContentWrapper>
        </main>
      </body>
    </html>
  );
}
