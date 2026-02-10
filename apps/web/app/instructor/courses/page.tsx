'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { fetchWithAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar03Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface Course {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    student_count: number;
}

export default function InstructorCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/courses`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
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
                <h1 className="text-3xl font-bold tracking-tight text-white">My Courses</h1>
                <p className="text-zinc-400">Manage content and view enrolled students</p>
            </div>

            {courses.length === 0 ? (
                <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                        <svg className="w-12 h-12 mb-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-sm font-medium">No courses assigned to you yet.</p>
                        <p className="text-xs text-zinc-600 mt-1">Contact admin to get course assignments.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {courses.map((course) => (
                        <Card key={course.course_id} className="bg-zinc-900/50 border-zinc-800 transition-colors hover:border-zinc-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-white">{course.course_name}</h3>
                                            <Badge variant="secondary" className="text-zinc-400 bg-zinc-800">
                                                {course.student_count} students
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {course.duration_weeks} weeks
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {course.student_count} enrolled
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                            <Link href={`/instructor/courses/${course.course_id}`}>
                                                Manage →
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
