'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';

export default function Navbar() {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setRole(getRole());
    }, []);

    const handleLogout = () => {
        logout();
        setRole(null);
        router.push('/login');
    };

    if (!role) return null;

    return (
        <nav className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <span className="text-xl font-bold text-indigo-600">UMS</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            >
                                Home
                            </Link>

                            {role === 'student' && (
                                <>
                                    <Link href="/student" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Dashboard
                                    </Link>
                                    <Link href="/student/courses" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Courses
                                    </Link>
                                </>
                            )}

                            {role === 'instructor' && (
                                <>
                                    <Link href="/instructor" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Dashboard
                                    </Link>
                                    <Link href="/instructor/courses" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        My Courses
                                    </Link>
                                </>
                            )}

                            {role === 'admin' && (
                                <>
                                    <Link href="/admin" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Dashboard
                                    </Link>
                                    <Link href="/admin/users" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Users
                                    </Link>
                                </>
                            )}

                            {role === 'analyst' && (
                                <>
                                    <Link href="/analyst" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Analytics
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-4 text-sm text-gray-500 capitalize">{role}</span>
                        <button
                            onClick={handleLogout}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
