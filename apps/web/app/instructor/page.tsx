'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Course {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    student_count: number;
}

interface Stats {
    total_courses: number;
    total_students: number;
    avg_student_score: number | null;
}

export default function InstructorDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, statsRes] = await Promise.all([
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/courses`),
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/stats`)
                ]);

                if (coursesRes.ok) setCourses(await coursesRes.json());
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
                <h1 className="text-3xl font-bold tracking-tight text-white">Instructor Dashboard</h1>
                <p className="text-zinc-400">Manage your courses and track student progress</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Assigned Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_courses || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_students || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Avg Student Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.avg_student_score ? `${stats.avg_student_score}%` : 'N/A'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* My Courses */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white tracking-tight">My Courses</h2>
                    <Button variant="link" asChild className="text-zinc-400 hover:text-white">
                        <Link href="/instructor/courses" className="flex items-center gap-1">View All <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" /></Link>
                    </Button>
                </div>

                {courses.length === 0 ? (
                    <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                            No courses assigned yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {courses.slice(0, 4).map((course) => (
                            <Card key={course.course_id} className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-white">{course.course_name}</h3>
                                            <p className="text-sm text-zinc-500 mt-1">
                                                {course.duration_weeks} weeks • {course.student_count} students
                                            </p>
                                        </div>
                                        <Button size="sm" variant="secondary" asChild>
                                            <Link href={`/instructor/courses/${course.course_id}`}>Manage</Link>
                                        </Button>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-zinc-500">Student Engagement</span>
                                            <span className="text-zinc-400">{course.student_count} enrolled</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-none overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-500"
                                                style={{ width: `${Math.min((course.student_count / 10) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
