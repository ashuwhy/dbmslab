'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Option { id: number; name?: string; title?: string }
interface CourseProposal { id: number; course_name: string; duration_weeks: number; status: string }
interface TopicProposal { id: number; topic_name: string; status: string }

export default function InstructorProposalsPage() {
    const [universities, setUniversities] = useState<Option[]>([]);
    const [programs, setPrograms] = useState<Option[]>([]);
    const [textbooks, setTextbooks] = useState<Option[]>([]);
    const [courseProposals, setCourseProposals] = useState<CourseProposal[]>([]);
    const [topicProposals, setTopicProposals] = useState<TopicProposal[]>([]);
    const [courseName, setCourseName] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('');
    const [universityId, setUniversityId] = useState('');
    const [programId, setProgramId] = useState('');
    const [textbookId, setTextbookId] = useState('');
    const [topicName, setTopicName] = useState('');
    const [message, setMessage] = useState('');

    const loadProposals = async () => {
        try {
            const [cRes, tRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/instructor/course-proposals`),
                fetchWithAuth(`${API_URL}/instructor/topic-proposals`),
            ]);
            if (cRes.ok) setCourseProposals(await cRes.json());
            if (tRes.ok) setTopicProposals(await tRes.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const [uRes, pRes, tRes, cRes, tPropRes] = await Promise.all([
                    fetchWithAuth(`${API_URL}/instructor/options/universities`),
                    fetchWithAuth(`${API_URL}/instructor/options/programs`),
                    fetchWithAuth(`${API_URL}/instructor/options/textbooks`),
                    fetchWithAuth(`${API_URL}/instructor/course-proposals`),
                    fetchWithAuth(`${API_URL}/instructor/topic-proposals`),
                ]);
                if (cancelled) return;
                if (uRes.ok) setUniversities(await uRes.json());
                if (pRes.ok) setPrograms(await pRes.json());
                if (tRes.ok) setTextbooks(await tRes.json());
                if (cRes.ok) setCourseProposals(await cRes.json());
                if (tPropRes.ok) setTopicProposals(await tPropRes.json());
            } catch (e) {
                if (!cancelled) console.error(e);
            }
        };
        run();
        return () => { cancelled = true; };
    }, []);

    const submitCourseProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/instructor/course-proposals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_name: courseName,
                    duration_weeks: parseInt(durationWeeks, 10),
                    university_id: parseInt(universityId, 10),
                    program_id: parseInt(programId, 10),
                    textbook_id: parseInt(textbookId, 10),
                }),
            });
            if (res.ok) {
                setMessage('Course proposal submitted.');
                setCourseName('');
                setDurationWeeks('');
                setUniversityId('');
                setProgramId('');
                setTextbookId('');
                loadProposals();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to submit');
        }
    };

    const submitTopicProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/instructor/topic-proposals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic_name: topicName }),
            });
            if (res.ok) {
                setMessage('Topic proposal submitted.');
                setTopicName('');
                loadProposals();
            } else {
                const d = await res.json().catch(() => ({}));
                setMessage(`Error: ${d.detail || res.statusText}`);
            }
        } catch {
            setMessage('Failed to submit');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Proposals</h1>
                <p className="text-zinc-400">Create course and topic proposals for admin approval</p>
            </div>
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{message}</div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">New Course Proposal</CardTitle>
                        <p className="text-sm text-zinc-500">Admin will review and create the course</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitCourseProposal} className="space-y-4">
                            <div>
                                <Label>Course name</Label>
                                <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="bg-black/20" />
                            </div>
                            <div>
                                <Label>Duration (weeks)</Label>
                                <Input type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} required className="bg-black/20" />
                            </div>
                            <div>
                                <Label>University</Label>
                                <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                    <option value="">Select</option>
                                    {universities.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Program</Label>
                                <select value={programId} onChange={(e) => setProgramId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                    <option value="">Select</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Textbook</Label>
                                <select value={textbookId} onChange={(e) => setTextbookId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                    <option value="">Select</option>
                                    {textbooks.map((t) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit">Submit course proposal</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">New Topic Proposal</CardTitle>
                        <p className="text-sm text-zinc-500">Admin will review and add the topic</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitTopicProposal} className="space-y-4">
                            <div>
                                <Label>Topic name</Label>
                                <Input value={topicName} onChange={(e) => setTopicName(e.target.value)} required className="bg-black/20" />
                            </div>
                            <Button type="submit">Submit topic proposal</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">My Course Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                    {courseProposals.length === 0 ? (
                        <p className="text-zinc-500">No course proposals yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {courseProposals.map((p) => (
                                <li key={p.id} className="flex justify-between items-center py-2 border-b border-zinc-800">
                                    <span className="text-white">{p.course_name}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : p.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-300'}`}>{p.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">My Topic Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                    {topicProposals.length === 0 ? (
                        <p className="text-zinc-500">No topic proposals yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {topicProposals.map((p) => (
                                <li key={p.id} className="flex justify-between items-center py-2 border-b border-zinc-800">
                                    <span className="text-white">{p.topic_name}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : p.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-300'}`}>{p.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}