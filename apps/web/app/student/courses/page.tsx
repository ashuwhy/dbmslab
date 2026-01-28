'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface Course {
    course_id: string;
    title: string;
    credits: number;
    description: string;
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const loadCourses = async () => {
        setLoading(true);
        try {
            const query = search ? `?query=${encodeURIComponent(search)}` : '';
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/courses${query}`);
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

    useEffect(() => {
        loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadCourses();
    };

    const handleEnroll = async (courseId: string) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/enrollments`, {
                method: 'POST',
                body: JSON.stringify({ course_id: courseId }),
            });

            if (res.ok) {
                setMessage('Enrolled successfully!');
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Enrollment failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Available Courses</h1>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search courses..."
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Search
                </button>
            </form>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <div key={course.course_id} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
                            <div className="min-w-0 flex-1">
                                <a href="#" className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-900">{course.course_id} - {course.title}</p>
                                    <p className="truncate text-sm text-gray-500">{course.credits} Credits</p>
                                </a>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent card click
                                    handleEnroll(course.course_id);
                                }}
                                className="relative z-10 inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Enroll
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
