'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { CameraVideoIcon, BookOpen01Icon, Note01Icon, File01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface ContentItem {
    content_id: number;
    title: string;
    content_type: string;
    url: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Student {
    student_id: number;
    full_name: string;
    email: string | null;
    evaluation_score: number | null;
}

interface Application {
    student_id: number;
    full_name: string;
    email: string | null;
    enroll_date: string;
}

export default function CourseContentPage() {
    const params = useParams();
    const courseId = params.id as string;

    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [contentType, setContentType] = useState('video');
    const [message, setMessage] = useState('');
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [activeTab, setActiveTab] = useState<'content' | 'students' | 'applications'>('content');
    const [gradeInputs, setGradeInputs] = useState<Record<number, string>>({});

    const fetchData = async () => {
        const [contentRes, studentsRes, appsRes] = await Promise.all([
            fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/content-items`),
            fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/students`),
            fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/applications`),
        ]);
        if (contentRes.ok) setContentItems(await contentRes.json());
        if (studentsRes.ok) setStudents(await studentsRes.json());
        if (appsRes.ok) setApplications(await appsRes.json());
    };

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/content-items`, {
                method: 'POST',
                body: JSON.stringify({ title, url, content_type: contentType }),
            });

            if (res.ok) {
                setMessage('Content added successfully!');
                setTitle('');
                setUrl('');
                // Refresh content list
                const refreshRes = await fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/content-items`);
                if (refreshRes.ok) setContentItems(await refreshRes.json());
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to add content');
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <HugeiconsIcon icon={CameraVideoIcon} className="w-5 h-5" />;
            case 'book': return <HugeiconsIcon icon={BookOpen01Icon} className="w-5 h-5" />;
            case 'notes': return <HugeiconsIcon icon={Note01Icon} className="w-5 h-5" />;
            default: return <HugeiconsIcon icon={File01Icon} className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="section-header">
                <h1 className="section-title">Manage Course #{courseId}</h1>
                <p className="section-description">Add content and view enrolled students</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('content')}
                >
                    Content ({contentItems.length})
                </button>
                <button
                    className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    Applications ({applications.length})
                </button>
                <button
                    className={`tab ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Students ({students.length})
                </button>
            </div>

            {activeTab === 'content' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Add Content Form */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Add Content</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Lesson 1: Introduction"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">URL</label>
                                <input
                                    type="url"
                                    required
                                    className="input"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Type</label>
                                <select
                                    className="input"
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                >
                                    <option value="video">Video</option>
                                    <option value="book">Book</option>
                                    <option value="notes">Notes</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                Add Content
                            </button>
                        </form>
                        {message && (
                            <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Content List */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Course Content</h3>
                        {contentItems.length === 0 ? (
                            <div className="card empty-state">
                                <p>No content added yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {contentItems.map((item) => (
                                    <div key={item.content_id} className="list-item">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{getContentIcon(item.content_type)}</span>
                                            <div>
                                                <p className="font-medium text-white">{item.title}</p>
                                                <p className="text-xs text-zinc-500">{item.content_type}</p>
                                            </div>
                                        </div>
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                Open <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'applications' && (
                <div>
                    {applications.length === 0 ? (
                        <div className="card empty-state">
                            <p>No pending applications.</p>
                        </div>
                    ) : (
                        <div className="card p-0 overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Applied</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app) => (
                                        <tr key={app.student_id}>
                                            <td className="text-white">{app.full_name}</td>
                                            <td className="text-zinc-400">{app.email || 'N/A'}</td>
                                            <td className="text-zinc-400">{app.enroll_date}</td>
                                            <td className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary text-sm"
                                                    onClick={async () => {
                                                        setMessage('');
                                                        try {
                                                            const res = await fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/applications/approve`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ student_id: app.student_id }),
                                                            });
                                                            if (res.ok) {
                                                                setMessage('Application approved');
                                                                fetchData();
                                                            } else {
                                                                const d = await res.json().catch(() => ({}));
                                                                setMessage(`Error: ${d.detail || res.statusText}`);
                                                            }
                                                        } catch {
                                                            setMessage('Failed to approve');
                                                        }
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary text-sm"
                                                    onClick={async () => {
                                                        setMessage('');
                                                        try {
                                                            const res = await fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/applications/reject`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ student_id: app.student_id }),
                                                            });
                                                            if (res.ok) {
                                                                setMessage('Application rejected');
                                                                fetchData();
                                                            } else setMessage('Failed to reject');
                                                        } catch {
                                                            setMessage('Failed to reject');
                                                        }
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {message && <p className={`p-3 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'students' && (
                <div>
                    {message && <p className={`mb-4 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
                    {students.length === 0 ? (
                        <div className="card empty-state">
                            <p>No students enrolled in this course yet.</p>
                        </div>
                    ) : (
                        <div className="card p-0 overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Score</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.student_id}>
                                            <td className="text-white">{student.full_name}</td>
                                            <td className="text-zinc-400">{student.email || 'N/A'}</td>
                                            <td>
                                                {student.evaluation_score !== null ? (
                                                    <span className={`badge ${student.evaluation_score >= 70 ? 'badge-success' : student.evaluation_score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {student.evaluation_score}%
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500">Pending</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        className="input w-20 text-sm"
                                                        placeholder="0-100"
                                                        value={gradeInputs[student.student_id] ?? (student.evaluation_score ?? '')}
                                                        onChange={(e) => setGradeInputs((prev) => ({ ...prev, [student.student_id]: e.target.value }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary text-sm"
                                                        onClick={async () => {
                                                            const val = gradeInputs[student.student_id] ?? student.evaluation_score ?? '';
                                                            const score = typeof val === 'string' ? parseInt(val, 10) : val;
                                                            if (Number.isNaN(score) || score < 0 || score > 100) {
                                                                setMessage('Enter a score between 0 and 100');
                                                                return;
                                                            }
                                                            setMessage('');
                                                            try {
                                                                const res = await fetchWithAuth(`${API_URL}/instructor/courses/${courseId}/students/${student.student_id}/grade`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ evaluation_score: score }),
                                                                });
                                                                if (res.ok) {
                                                                    setMessage('Grade saved');
                                                                    fetchData();
                                                                } else {
                                                                    const d = await res.json().catch(() => ({}));
                                                                    setMessage(`Error: ${d.detail || res.statusText}`);
                                                                }
                                                            } catch {
                                                                setMessage('Failed to save grade');
                                                            }
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
