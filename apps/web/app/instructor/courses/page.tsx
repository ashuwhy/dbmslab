'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { fetchWithAuth } from '@/lib/auth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

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
                <div className="loading"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="section-header">
                <h1 className="section-title">My Courses</h1>
                <p className="section-description">Manage content and view enrolled students</p>
            </div>

            {courses.length === 0 ? (
                <div className="card empty-state">
                    <p>No courses assigned to you yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {courses.map((course) => (
                        <div key={course.course_id} className="card">
                            <div className="flex items-center justify-between">
                                <div>




                                    <h3 className="text-lg font-semibold text-white">{course.course_name}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                                        <span className="flex items-center gap-1"><HugeiconsIcon icon={Calendar03Icon} className="w-4 h-4" /> {course.duration_weeks} weeks</span>
                                        <span className="flex items-center gap-1"><HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" /> {course.student_count} students</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/instructor/courses/${course.course_id}`}
                                        className="btn btn-primary"
                                    >
                                        Add Content
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
