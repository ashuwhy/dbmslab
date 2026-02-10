'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ContentItem {
    content_id: number;
    title: string;
    content_type: string;
    url: string | null;
}

interface CourseDetail {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    max_capacity: number;
    current_enrollment: number;
    university_name: string | null;
    program_name: string | null;
    textbook_title: string | null;
    textbook_url: string | null;
    topics: string[];
    evaluation_score: number | null;
    enroll_date: string | null;
    content_items: ContentItem[];
    instructors: {
        instructor_id: number;
        full_name: string;
        email: string | null;
        role: string | null;
    }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
};

const scoreVariant = (score: number | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score === null || score === undefined) return 'outline';
    if (score >= 70) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
};

export default function StudentCourseDetailPage() {
    const params = useParams();
    const courseId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetchWithAuth(`${API_URL}/student/courses/${courseId}`);
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setError(err?.detail || 'Failed to load course details');
                    setCourse(null);
                    return;
                }
                const data = await res.json();
                setCourse(data);
            } catch {
                setError('Failed to load course details');
                setCourse(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Course Details</h1>
                        <p className="text-zinc-400">Unable to load this course.</p>
                    </div>
                    <Button variant="secondary" asChild>
                        <Link href="/student">Back to Dashboard</Link>
                    </Button>
                </div>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-6">
                        <p className="text-sm text-red-400">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Course Details</h1>
                        <p className="text-zinc-400">No course data available.</p>
                    </div>
                    <Button variant="secondary" asChild>
                        <Link href="/student">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{course.course_name}</h1>
                    <p className="text-zinc-400">Course #{course.course_id}</p>
                </div>
                <Button variant="secondary" asChild>
                    <Link href="/student">Back to Dashboard</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Evaluation Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={scoreVariant(course.evaluation_score)}>
                            {course.evaluation_score !== null ? `${course.evaluation_score}%` : 'In Progress'}
                        </Badge>
                        <p className="text-xs text-zinc-500 mt-2">Enrolled: {formatDate(course.enroll_date)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Enrollment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {course.current_enrollment}/{course.max_capacity}
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Current enrollment</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{course.duration_weeks} weeks</div>
                        <p className="text-xs text-zinc-500 mt-2">Course length</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Course Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                        <div>
                            <p className="text-xs uppercase text-zinc-500">University</p>
                            <p className="text-white">{course.university_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-zinc-500">Program</p>
                            <p className="text-white">{course.program_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-zinc-500">Textbook</p>
                            {course.textbook_url ? (
                                <a
                                    href={course.textbook_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    {course.textbook_title || course.textbook_url}
                                </a>
                            ) : (
                                <p className="text-white">{course.textbook_title || 'N/A'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase text-zinc-500">Capacity</p>
                            <p className="text-white">
                                {course.current_enrollment}/{course.max_capacity}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Instructors</CardTitle>
                </CardHeader>
                <CardContent>
                    {course.instructors.length === 0 ? (
                        <p className="text-sm text-zinc-500">No instructors assigned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {course.instructors.map((instructor) => (
                                <div
                                    key={instructor.instructor_id}
                                    className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-none border border-zinc-800 bg-zinc-900/40 p-4"
                                >
                                    <div>
                                        <p className="text-white font-medium">{instructor.full_name}</p>
                                        <p className="text-xs text-zinc-500">{instructor.email || 'Email not available'}</p>
                                    </div>
                                    {instructor.role ? (
                                        <Badge variant="secondary">{instructor.role}</Badge>
                                    ) : (
                                        <Badge variant="outline">Instructor</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Course Topics</CardTitle>
                </CardHeader>
                <CardContent>
                    {course.topics.length === 0 ? (
                        <p className="text-sm text-zinc-500">No topics listed for this course.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {course.topics.map((topic) => (
                                <Badge key={topic} variant="secondary">
                                    {topic}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                    {course.content_items.length === 0 ? (
                        <p className="text-sm text-zinc-500">No content available for this course.</p>
                    ) : (
                        <div className="space-y-2">
                            {course.content_items.map((item) => (
                                <div
                                    key={item.content_id}
                                    className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-none border border-zinc-800 bg-zinc-900/40 p-4"
                                >
                                    <div>
                                        <p className="text-white font-medium">{item.title}</p>
                                        <p className="text-xs text-zinc-500 uppercase">{item.content_type}</p>
                                    </div>
                                    {item.url ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            Open resource
                                        </a>
                                    ) : (
                                        <span className="text-xs text-zinc-500">No link provided</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
