'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    window.addEventListener('auth-change', callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('auth-change', callback);
    };
};

export default function Navbar() {
    const role = useSyncExternalStore(subscribe, getRole, () => null);
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        // Since logout redirects, we might not need to manually push, 
        // but keeping it for safety if logout() behavior changes.
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    // Always render navbar, but content depends on role (or lack thereof)
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'border-red-900 text-red-400 bg-red-900/10';
            case 'instructor': return 'border-blue-900 text-blue-400 bg-blue-900/10';
            case 'student': return 'border-green-900 text-green-400 bg-green-900/10';
            case 'analyst': return 'border-yellow-900 text-yellow-400 bg-yellow-900/10';
            default: return 'border-zinc-700 text-zinc-400';
        }
    };

    return (
        <nav className="border-b border-zinc-800 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-50 transition-all duration-300">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight hover:text-blue-400 transition-colors">
                            <span>Index Corruption Institute</span>
                        </Link>
                        <div className="flex items-center gap-1">
                            {role === 'student' && (
                                <>
                                    <Button variant={isActive('/student') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/student">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/student/courses') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/student/courses">Courses</Link>
                                    </Button>
                                </>
                            )}
                            {role === 'instructor' && (
                                <>
                                    <Button variant={isActive('/instructor') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/instructor">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/instructor/courses') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/instructor/courses">My Courses</Link>
                                    </Button>
                                    <Button variant={isActive('/instructor/proposals') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/instructor/proposals">Proposals</Link>
                                    </Button>
                                </>
                            )}
                            {role === 'admin' && (
                                <>
                                    <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/admin">Dashboard</Link>
                                    </Button>
                                    <Button variant={isActive('/admin/approvals') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/admin/approvals">Approvals</Link>
                                    </Button>
                                    <Button variant={isActive('/admin/users') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/admin/users">Users</Link>
                                    </Button>
                                    <Button variant={isActive('/admin/courses') ? 'secondary' : 'ghost'} asChild className="h-8 text-sm">
                                        <Link href="/admin/courses">Courses</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {role ? (
                            <>
                                <Badge variant="outline" className={`uppercase text-[10px] tracking-widest px-2 py-0.5 ${getRoleBadgeColor(role)}`}>
                                    {role}
                                </Badge>
                                <div className="h-4 w-[1px] bg-zinc-800"></div>
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" asChild className="bg-white text-black hover:bg-zinc-200">
                                <Link href="/login">Sign in</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
