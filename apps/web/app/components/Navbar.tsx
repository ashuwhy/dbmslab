'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const emptySubscribe = () => () => { };

export default function Navbar() {
    const role = useSyncExternalStore(emptySubscribe, getRole, () => null);
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!role) return null;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <nav className="border-b border-zinc-800 sticky top-0 bg-[#09090b] z-50">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-lg font-bold text-white tracking-tight">
                            Index Corruption Intitude
                        </Link>
                        <div className="flex items-center gap-1">
                            {role === 'student' && (
                                <>
                                    <Button variant={isActive('/student') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/student">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/student/courses') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/student/courses">Courses</Link>
                                    </Button>
                                </>
                            )}
                            {role === 'instructor' && (
                                <>
                                    <Button variant={isActive('/instructor') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/instructor">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/instructor/courses') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/instructor/courses">My Courses</Link>
                                    </Button>
                                </>
                            )}
                            {role === 'admin' && (
                                <>
                                    <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/admin">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/admin/users') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/admin/users">Users</Link>
                                    </Button>
                                    <Button variant={isActive('/admin/courses') ? 'secondary' : 'ghost'} asChild className="h-8">
                                        <Link href="/admin/courses">Courses</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="uppercase text-xs tracking-wider border-zinc-700 text-zinc-400">
                            {role}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white">
                            Sign out
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
