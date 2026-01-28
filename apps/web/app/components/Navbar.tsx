'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';

export default function Navbar() {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setRole(getRole());
    }, []);

    const handleLogout = () => {
        logout();
        setRole(null);
        router.push('/login');
    };

    if (!role) return null;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const linkClass = (path: string) =>
        `text-sm transition-colors ${isActive(path) ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`;

    return (
        <nav className="border-b border-zinc-800 sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-50">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex h-14 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-lg font-bold text-white">
                            MOOC
                        </Link>
                        <div className="flex items-center gap-6">
                            {role === 'student' && (
                                <>
                                    <Link href="/student" className={linkClass('/student')}>Dashboard</Link>
                                    <Link href="/student/courses" className={linkClass('/student/courses')}>Courses</Link>
                                </>
                            )}
                            {role === 'instructor' && (
                                <>
                                    <Link href="/instructor" className={linkClass('/instructor')}>Dashboard</Link>
                                    <Link href="/instructor/courses" className={linkClass('/instructor/courses')}>My Courses</Link>
                                </>
                            )}
                            {role === 'admin' && (
                                <>
                                    <Link href="/admin" className={linkClass('/admin')}>Dashboard</Link>
                                    <Link href="/admin/users" className={linkClass('/admin/users')}>Users</Link>
                                    <Link href="/admin/courses" className={linkClass('/admin/courses')}>Courses</Link>
                                    <Link href="/admin/students" className={linkClass('/admin/students')}>Students</Link>
                                    <Link href="/admin/instructors" className={linkClass('/admin/instructors')}>Instructors</Link>
                                </>
                            )}
                            {role === 'analyst' && (
                                <Link href="/analyst" className={linkClass('/analyst')}>Analytics</Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500 uppercase tracking-wide px-2 py-1 bg-zinc-900 rounded">
                            {role}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
