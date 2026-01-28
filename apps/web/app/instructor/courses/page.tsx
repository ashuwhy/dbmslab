'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';

interface Course {
    course_id: string;
    title: string;
    credits: number;
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Assigned Courses</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <div key={course.course_id} className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{course.title}</h5>
                        <p className="font-normal text-gray-700">{course.course_id} • {course.credits} Credits</p>
                        <Link
                            href={`/instructor/courses/${course.course_id}`}
                            className="inline-flex mt-4 items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                        >
                            Manage Content
                        </Link>
                    </div>
                ))}
                {courses.length === 0 && <p>No courses assigned.</p>}
            </div>
        </div>
    );
}
