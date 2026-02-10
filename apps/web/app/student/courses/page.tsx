'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface Course {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    university_name: string | null;
    program_name: string | null;
    topics: string[];
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState('');
    const [topic, setTopic] = useState('');
    const [university, setUniversity] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());

    const loadCourses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('query', search);
            if (topic) params.append('topic', topic);
            if (university) params.append('university', university);

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/courses${queryString}`);
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

    const loadEnrollments = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/enrollments/me`);
            if (res.ok) {
                const data = await res.json();
                setEnrolledIds(new Set(data.map((e: any) => e.course_id)));
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadCourses();
        loadEnrollments();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadCourses();
    };

    const handleEnroll = async (courseId: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/enrollments`, {
                method: 'POST',
                body: JSON.stringify({ course_id: courseId }),
            });

            if (res.ok) {
                setMessage('Application submitted. Instructor will review.');
                loadEnrollments();
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
            <div className="section-header">
                <h1 className="section-title">Available Courses</h1>
                <p className="section-description">Browse and apply for courses from top universities</p>
            </div>

            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                    type="text"
                    placeholder="Search courses..."
                    className="input md:col-span-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Filter by topic..."
                    className="input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="University..."
                        className="input flex-1"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary px-6">
                        Search
                    </button>
                </div>
            </form>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                    {message}
                </div>
            )}

            {/* Courses Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="loading"></div>
                </div>
            ) : courses.length === 0 ? (
                <div className="card empty-state">
                    <p>No courses found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {courses.map((course) => (
                        <div key={course.course_id} className="card hover:border-zinc-600">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">{course.course_name}</h3>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
                                        {course.university_name && (
                                            <span>🏛️ {course.university_name}</span>
                                        )}
                                        <span>📅 {course.duration_weeks} weeks</span>
                                        {course.program_name && (
                                            <span>📜 {course.program_name}</span>
                                        )}
                                    </div>
                                    {course.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {course.topics.map((t, i) => (
                                                <span key={i} className="badge badge-primary">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {enrolledIds.has(course.course_id) ? (
                                        <span className="badge badge-success">Enrolled ✓</span>
                                    ) : (
                                        <button
                                            onClick={() => handleEnroll(course.course_id)}
                                            className="btn btn-secondary"
                                        >
                                            Apply
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
