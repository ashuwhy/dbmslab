'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="text-zinc-400">Welcome back! Track your learning progress.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Enrolled Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_enrollments || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.courses_completed || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.avg_score ? `${stats.avg_score}%` : 'N/A'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <Button asChild>
                    <Link href="/student/courses">Browse Courses</Link>
                </Button>
            </div>

            {/* My Enrollments */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white tracking-tight">My Enrollments</h2>

                {enrollments.length === 0 ? (
                    <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <p className="text-zinc-500 mb-4">You haven&apos;t enrolled in any courses yet.</p>
                            <Button variant="link" asChild>
                                <Link href="/student/courses" className="flex items-center gap-1">Browse available courses <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {enrollments.map((enrollment) => (
                            <Link
                                key={enrollment.course_id}
                                href={`/student/courses/${enrollment.course_id}`}
                                className="block"
                            >
                                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-semibold text-white">{enrollment.course_name}</p>
                                            <p className="text-sm text-zinc-500">
                                                Enrolled: {new Date(enrollment.enroll_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            {enrollment.evaluation_score !== null ? (
                                                <Badge variant={enrollment.evaluation_score >= 70 ? 'default' : enrollment.evaluation_score >= 50 ? 'secondary' : 'destructive'}>
                                                    Score: {enrollment.evaluation_score}%
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">In Progress</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
