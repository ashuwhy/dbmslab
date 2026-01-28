'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface Course {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    university_name: string | null;
    program_name: string | null;
    enrollment_count: number;
}

interface Instructor {
    instructor_id: number;
    full_name: string;
    email: string | null;
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, instructorsRes] = await Promise.all([
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/courses`),
                    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/instructors`)
                ]);

                if (coursesRes.ok) setCourses(await coursesRes.json());
                if (instructorsRes.ok) setInstructors(await instructorsRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!selectedCourse || !selectedInstructor) return;
        setMessage('');

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/courses/${selectedCourse}/assign-instructor`, {
                method: 'POST',
                body: JSON.stringify({ instructor_id: selectedInstructor, role: 'instructor' }),
            });

            if (res.ok) {
                setMessage('Instructor assigned successfully');
                setSelectedCourse(null);
                setSelectedInstructor(null);
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to assign instructor');
        }
    };

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
                <h1 className="section-title">Course Management</h1>
                <p className="section-description">View courses and assign instructors</p>
            </div>

            {/* Assign Instructor */}
            <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Assign Instructor to Course</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Select Course</label>
                        <select
                            className="input"
                            value={selectedCourse || ''}
                            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
                        >
                            <option value="">Choose a course...</option>
                            {courses.map((c) => (
                                <option key={c.course_id} value={c.course_id}>
                                    {c.course_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Select Instructor</label>
                        <select
                            className="input"
                            value={selectedInstructor || ''}
                            onChange={(e) => setSelectedInstructor(Number(e.target.value) || null)}
                        >
                            <option value="">Choose an instructor...</option>
                            {instructors.map((i) => (
                                <option key={i.instructor_id} value={i.instructor_id}>
                                    {i.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleAssign}
                            disabled={!selectedCourse || !selectedInstructor}
                            className="btn btn-primary w-full disabled:opacity-50"
                        >
                            Assign
                        </button>
                    </div>
                </div>
                {message && (
                    <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* Courses List */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">All Courses ({courses.length})</h3>
                <div className="card p-0 overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Course Name</th>
                                <th>University</th>
                                <th>Program</th>
                                <th>Duration</th>
                                <th>Enrollments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course.course_id}>
                                    <td className="text-zinc-400">#{course.course_id}</td>
                                    <td className="text-white font-medium">{course.course_name}</td>
                                    <td className="text-zinc-400">{course.university_name || 'N/A'}</td>
                                    <td className="text-zinc-400">{course.program_name || 'N/A'}</td>
                                    <td className="text-zinc-400">{course.duration_weeks} weeks</td>
                                    <td>
                                        <span className="badge badge-primary">{course.enrollment_count}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
