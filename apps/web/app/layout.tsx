import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';

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
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
