'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface Instructor {
    instructor_id: number;
    full_name: string;
    email: string | null;
}

export default function AdminInstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInstructors = async () => {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/instructors`);
                if (res.ok) setInstructors(await res.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadInstructors();
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
                <h1 className="section-title">Instructor Management</h1>
                <p className="section-description">View all instructors</p>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.map((instructor) => (
                            <tr key={instructor.instructor_id}>
                                <td className="text-zinc-400">#{instructor.instructor_id}</td>
                                <td className="text-white font-medium">{instructor.full_name}</td>
                                <td className="text-zinc-400">{instructor.email || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {instructors.length === 0 && (
                <div className="card empty-state">
                    <p>No instructors found in the database.</p>
                </div>
            )}
        </div>
    );
}
