'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Stats {
    total_users: number;
    total_courses: number;
    total_students: number;
    total_instructors: number;
    total_enrollments: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/stats`);
                if (res.ok) setStats(await res.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: '👤' },
        { label: 'Courses', value: stats?.total_courses || 0, icon: '📚' },
        { label: 'Students', value: stats?.total_students || 0, icon: '🎓' },
        { label: 'Instructors', value: stats?.total_instructors || 0, icon: '👨‍🏫' },
        { label: 'Enrollments', value: stats?.total_enrollments || 0, icon: '📝' },
    ];

    const quickLinks = [
        { href: '/admin/approvals', label: 'Pending Approvals', desc: 'Approve instructors, analysts, and course/topic proposals' },
        { href: '/admin/users', label: 'Manage Users', desc: 'Create and manage user accounts' },
        { href: '/admin/courses', label: 'Manage Courses', desc: 'View all courses and assignments' },
        { href: '/admin/students', label: 'Manage Students', desc: 'View and remove students' },
        { href: '/admin/instructors', label: 'Manage Instructors', desc: 'Assign instructors to courses' },
    ];

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
                <p className="text-zinc-400">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                {stat.label}
                            </CardTitle>
                            <span className="text-xl">{stat.icon}</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white tracking-tight">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {quickLinks.map((link, i) => (
                        <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                            <Link href={link.href} className="block p-6">
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{link.label}</h3>
                                <p className="text-sm text-zinc-500 mt-1">{link.desc}</p>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
