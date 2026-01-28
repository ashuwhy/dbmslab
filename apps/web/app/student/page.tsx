'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';

interface Enrollment {
    course_id: number;
    course_name: string;
    enroll_date: string;
    evaluation_score: number | null;
}

interface Stats {
    total_enrollments: number;
    avg_score: number | null;
    courses_completed: number;
}

export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [enrollRes, statsRes] = await Promise.all([
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/enrollments/me`),
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/stats`)
                ]);

                if (enrollRes.ok) setEnrollments(await enrollRes.json());
                if (statsRes.ok) setStats(await statsRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="loading"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="section-header">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-400 mt-1">Welcome back! Track your learning progress.</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="card">
                    <p className="card-header">Enrolled Courses</p>
                    <p className="card-value">{stats?.total_enrollments || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Completed</p>
                    <p className="card-value">{stats?.courses_completed || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Average Score</p>
                    <p className="card-value">{stats?.avg_score ? `${stats.avg_score}%` : 'N/A'}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
                <Link href="/student/courses" className="btn btn-primary">
                    Browse Courses
                </Link>
            </div>

            {/* My Enrollments */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">My Enrollments</h2>

                {enrollments.length === 0 ? (
                    <div className="card empty-state">
                        <p>You haven&apos;t enrolled in any courses yet.</p>
                        <Link href="/student/courses" className="text-blue-400 hover:underline mt-2 inline-block">
                            Browse available courses →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {enrollments.map((enrollment) => (
                            <div key={enrollment.course_id} className="list-item">
                                <div className="flex-1">
                                    <p className="font-medium text-white">{enrollment.course_name}</p>
                                    <p className="text-sm text-zinc-500">
                                        Enrolled: {new Date(enrollment.enroll_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {enrollment.evaluation_score !== null ? (
                                        <div>
                                            <span className={`badge ${enrollment.evaluation_score >= 70 ? 'badge-success' : enrollment.evaluation_score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                                Score: {enrollment.evaluation_score}%
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="badge badge-primary">In Progress</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
