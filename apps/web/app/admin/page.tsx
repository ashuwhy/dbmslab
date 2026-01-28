'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';

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
                <div className="loading"></div>
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
        { href: '/admin/users', label: 'Manage Users', desc: 'Create and manage user accounts' },
        { href: '/admin/courses', label: 'Manage Courses', desc: 'View all courses and assignments' },
        { href: '/admin/students', label: 'Manage Students', desc: 'View and remove students' },
        { href: '/admin/instructors', label: 'Manage Instructors', desc: 'Assign instructors to courses' },
    ];

    return (
        <div className="space-y-8">
            <div className="section-header">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-zinc-400 mt-1">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className="card">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{stat.icon}</span>
                            <p className="card-header">{stat.label}</p>
                        </div>
                        <p className="card-value">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {quickLinks.map((link, i) => (
                        <Link key={i} href={link.href} className="card hover:border-zinc-600">
                            <h3 className="font-semibold text-white">{link.label}</h3>
                            <p className="text-sm text-zinc-400 mt-1">{link.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
