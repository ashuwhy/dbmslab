'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface Student {
    student_id: number;
    full_name: string;
    email: string | null;
    country: string;
    age: number;
    skill_level: string | null;
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadStudents = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/students`);
            if (res.ok) setStudents(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const handleDelete = async (studentId: number) => {
        if (!confirm('This will delete the student and all their enrollments. Continue?')) return;

        setMessage('');
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/students/${studentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setMessage('Student deleted successfully');
                loadStudents();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to delete student');
        }
    };

    const getSkillBadge = (level: string | null) => {
        if (!level) return 'badge-primary';
        switch (level.toLowerCase()) {
            case 'advanced': return 'badge-success';
            case 'intermediate': return 'badge-warning';
            default: return 'badge-primary';
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
                <h1 className="section-title">Student Management</h1>
                <p className="section-description">View and manage all students</p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {message}
                </div>
            )}

            <div className="card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Country</th>
                            <th>Age</th>
                            <th>Skill Level</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.student_id}>
                                <td className="text-zinc-400">#{student.student_id}</td>
                                <td className="text-white font-medium">{student.full_name}</td>
                                <td className="text-zinc-400">{student.email || 'N/A'}</td>
                                <td className="text-zinc-400">{student.country}</td>
                                <td className="text-zinc-400">{student.age}</td>
                                <td>
                                    <span className={`badge ${getSkillBadge(student.skill_level)}`}>
                                        {student.skill_level || 'Unknown'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(student.student_id)}
                                        className="btn btn-danger text-xs py-1 px-2"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
