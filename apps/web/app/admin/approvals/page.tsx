'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PendingInstructor {
    id: number;
    email: string;
    full_name: string;
    teaching_years: number | null;
}

interface PendingAnalyst {
    id: number;
    email: string;
}

interface CourseProposalItem {
    id: number;
    instructor_id: number;
    instructor_name: string;
    course_name: string;
    duration_weeks: number;
    status: string;
}

interface TopicProposalItem {
    id: number;
    instructor_id: number;
    instructor_name: string;
    topic_name: string;
    status: string;
}

export default function AdminApprovalsPage() {
    const [instructors, setInstructors] = useState<PendingInstructor[]>([]);
    const [analysts, setAnalysts] = useState<PendingAnalyst[]>([]);
    const [courseProposals, setCourseProposals] = useState<CourseProposalItem[]>([]);
    const [topicProposals, setTopicProposals] = useState<TopicProposalItem[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [iRes, aRes, cRes, tRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/admin/pending-instructors`),
                fetchWithAuth(`${API_URL}/admin/pending-analysts`),
                fetchWithAuth(`${API_URL}/admin/course-proposals`),
                fetchWithAuth(`${API_URL}/admin/topic-proposals`),
            ]);
            if (iRes.ok) setInstructors(await iRes.json());
            if (aRes.ok) setAnalysts(await aRes.json());
            if (cRes.ok) setCourseProposals(await cRes.json());
            if (tRes.ok) setTopicProposals(await tRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const approveInstructor = async (userId: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/approve-instructor/${userId}`, { method: 'POST' });
            if (res.ok) {
                setMessage('Instructor approved');
                load();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to approve');
        }
    };

    const approveAnalyst = async (userId: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/approve-analyst/${userId}`, { method: 'POST' });
            if (res.ok) {
                setMessage('Analyst approved');
                load();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to approve');
        }
    };

    const approveCourseProposal = async (id: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/course-proposals/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (res.ok) {
                setMessage('Course proposal approved and course created');
                load();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to approve');
        }
    };

    const rejectCourseProposal = async (id: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/course-proposals/${id}/reject`, { method: 'POST' });
            if (res.ok) {
                setMessage('Course proposal rejected');
                load();
            } else setMessage('Failed to reject');
        } catch {
            setMessage('Failed to reject');
        }
    };

    const approveTopicProposal = async (id: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/topic-proposals/${id}/approve`, { method: 'POST' });
            if (res.ok) {
                setMessage('Topic proposal approved');
                load();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to approve');
        }
    };

    const rejectTopicProposal = async (id: number) => {
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/topic-proposals/${id}/reject`, { method: 'POST' });
            if (res.ok) {
                setMessage('Topic proposal rejected');
                load();
            } else setMessage('Failed to reject');
        } catch {
            setMessage('Failed to reject');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Pending Approvals</h1>
                <p className="text-zinc-400">Approve instructors, analysts, and course/topic proposals</p>
            </div>
            {message && (
                <div className="p-3 rounded-md bg-zinc-800 text-sm text-white">{message}</div>
            )}

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Pending Instructors</CardTitle>
                    <p className="text-sm text-zinc-500">Approve to allow them to sign in and use instructor features</p>
                </CardHeader>
                <CardContent>
                    {instructors.length === 0 ? (
                        <p className="text-zinc-500">No pending instructors</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Teaching years</TableHead>
                                    <TableHead className="w-[120px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {instructors.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="text-white">{u.full_name}</TableCell>
                                        <TableCell className="text-zinc-400">{u.email}</TableCell>
                                        <TableCell className="text-zinc-400">{u.teaching_years ?? '—'}</TableCell>
                                        <TableCell>
                                            <Button size="sm" onClick={() => approveInstructor(u.id)}>Approve</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Pending Analysts</CardTitle>
                    <p className="text-sm text-zinc-500">Approve to allow them to sign in and use analytics</p>
                </CardHeader>
                <CardContent>
                    {analysts.length === 0 ? (
                        <p className="text-zinc-500">No pending analysts</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-[120px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysts.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="text-white">{u.email}</TableCell>
                                        <TableCell>
                                            <Button size="sm" onClick={() => approveAnalyst(u.id)}>Approve</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Pending Course Proposals</CardTitle>
                    <p className="text-sm text-zinc-500">Approve to create the course and assign the instructor</p>
                </CardHeader>
                <CardContent>
                    {courseProposals.length === 0 ? (
                        <p className="text-zinc-500">No pending course proposals</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Weeks</TableHead>
                                    <TableHead className="w-[180px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courseProposals.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-white">{p.course_name}</TableCell>
                                        <TableCell className="text-zinc-400">{p.instructor_name}</TableCell>
                                        <TableCell className="text-zinc-400">{p.duration_weeks}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="sm" onClick={() => approveCourseProposal(p.id)}>Approve</Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectCourseProposal(p.id)}>Reject</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Pending Topic Proposals</CardTitle>
                    <p className="text-sm text-zinc-500">Approve to add the topic to the platform</p>
                </CardHeader>
                <CardContent>
                    {topicProposals.length === 0 ? (
                        <p className="text-zinc-500">No pending topic proposals</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead className="w-[180px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topicProposals.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-white">{p.topic_name}</TableCell>
                                        <TableCell className="text-zinc-400">{p.instructor_name}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="sm" onClick={() => approveTopicProposal(p.id)}>Approve</Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectTopicProposal(p.id)}>Reject</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
