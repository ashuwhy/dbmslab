'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';

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
                <div className="loading"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="section-header">
                <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
                <p className="text-zinc-400 mt-1">Manage your courses and track student progress</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="card">
                    <p className="card-header">Assigned Courses</p>
                    <p className="card-value">{stats?.total_courses || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Total Students</p>
                    <p className="card-value">{stats?.total_students || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Avg Student Score</p>
                    <p className="card-value">{stats?.avg_student_score ? `${stats.avg_student_score}%` : 'N/A'}</p>
                </div>
            </div>

            {/* My Courses */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">My Courses</h2>
                    <Link href="/instructor/courses" className="text-sm text-zinc-400 hover:text-white">
                        View All →
                    </Link>
                </div>

                {courses.length === 0 ? (
                    <div className="card empty-state">
                        <p>No courses assigned yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {courses.slice(0, 4).map((course) => (
                            <div key={course.course_id} className="card">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-white">{course.course_name}</h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            {course.duration_weeks} weeks • {course.student_count} students
                                        </p>
                                    </div>
                                    <Link
                                        href={`/instructor/courses/${course.course_id}`}
                                        className="btn btn-secondary text-sm"
                                    >
                                        Manage
                                    </Link>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-zinc-500">Student Engagement</span>
                                        <span className="text-zinc-400">{course.student_count} enrolled</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${Math.min((course.student_count / 10) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
