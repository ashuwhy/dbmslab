'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table, TableHeader, TableRow, TableHead,
    TableBody, TableCell
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Types ────────────────────────────────────────────────────────
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

interface Analytics {
    distribution: Record<string, number>;
    pass_rate: number;
    at_risk_count: number;
    total_students: number;
    avg_score: number | null;
}

type TabKey = 'content' | 'students' | 'analytics';

// ── Component ────────────────────────────────────────────────────

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;

    // State
    const [activeTab, setActiveTab] = useState<TabKey>('content');
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    // Add Content form
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [contentType, setContentType] = useState('video');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Grading dialog
    const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
    const [gradeValue, setGradeValue] = useState('');
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
    const [grading, setGrading] = useState(false);

    // ── Data Fetching ────────────────────────────────────────────

    const fetchContent = useCallback(async () => {
        const res = await fetchWithAuth(`${API}/instructor/courses/${courseId}/content-items`);
        if (res.ok) setContentItems(await res.json());
    }, [courseId]);

    const fetchStudents = useCallback(async () => {
        const res = await fetchWithAuth(`${API}/instructor/courses/${courseId}/students`);
        if (res.ok) setStudents(await res.json());
    }, [courseId]);

    const fetchAnalytics = useCallback(async () => {
        const res = await fetchWithAuth(`${API}/instructor/courses/${courseId}/analytics`);
        if (res.ok) setAnalytics(await res.json());
    }, [courseId]);

    useEffect(() => {
        const load = async () => {
            await Promise.all([fetchContent(), fetchStudents()]);
            setLoading(false);
        };
        load();
    }, [fetchContent, fetchStudents]);

    useEffect(() => {
        if (activeTab === 'analytics' && !analytics) {
            fetchAnalytics();
        }
    }, [activeTab, analytics, fetchAnalytics]);

    // ── Handlers ─────────────────────────────────────────────────

    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            const res = await fetchWithAuth(`${API}/instructor/courses/${courseId}/content-items`, {
                method: 'POST',
                body: JSON.stringify({ title, url, content_type: contentType }),
            });
            if (res.ok) {
                setMessage({ text: 'Content added successfully!', type: 'success' });
                setTitle('');
                setUrl('');
                fetchContent();
            } else {
                const err = await res.json();
                setMessage({ text: `Error: ${err.detail}`, type: 'error' });
            }
        } catch {
            setMessage({ text: 'Failed to add content', type: 'error' });
        }
    };

    const handleDeleteContent = async (contentId: number) => {
        try {
            const res = await fetchWithAuth(`${API}/instructor/courses/${courseId}/content-items/${contentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setMessage({ text: 'Content deleted.', type: 'success' });
                fetchContent();
            }
        } catch {
            setMessage({ text: 'Failed to delete content', type: 'error' });
        }
    };

    const handleGradeSubmit = async () => {
        if (!gradingStudent || gradeValue === '') return;
        setGrading(true);
        try {
            const res = await fetchWithAuth(
                `${API}/instructor/enrollments/${gradingStudent.student_id}/${courseId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ evaluation_score: parseInt(gradeValue) }),
                }
            );
            if (res.ok) {
                setGradeDialogOpen(false);
                setGradingStudent(null);
                setGradeValue('');
                fetchStudents();
                // Refresh analytics if already loaded
                if (analytics) fetchAnalytics();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch {
            alert('Failed to update grade');
        } finally {
            setGrading(false);
        }
    };

    // ── Bulk Operations ──────────────────────────────────────────

    const handleExportCSV = () => {
        if (students.length === 0) return;
        const headers = ['Student ID', 'Name', 'Email', 'Score'];
        const rows = students.map(s => [
            s.student_id,
            s.full_name,
            s.email || 'N/A',
            s.evaluation_score !== null ? s.evaluation_score : 'Pending'
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `course_${courseId}_students.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyEmails = () => {
        const emails = students.filter(s => s.email).map(s => s.email).join(', ');
        navigator.clipboard.writeText(emails);
        setMessage({ text: `${students.filter(s => s.email).length} emails copied to clipboard!`, type: 'success' });
    };

    // ── Helpers ──────────────────────────────────────────────────

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return '🎬';
            case 'book': return '📚';
            case 'notes': return '📝';
            default: return '📄';
        }
    };

    const getScoreBadge = (score: number | null) => {
        if (score === null) return <span className="text-zinc-600 text-sm italic">Pending</span>;
        if (score >= 80) return <Badge className="bg-emerald-900/50 text-emerald-400 border-emerald-800">{score}%</Badge>;
        if (score >= 60) return <Badge className="bg-sky-900/50 text-sky-400 border-sky-800">{score}%</Badge>;
        if (score >= 40) return <Badge className="bg-amber-900/50 text-amber-400 border-amber-800">{score}%</Badge>;
        return <Badge className="bg-red-900/50 text-red-400 border-red-800">{score}%</Badge>;
    };

    // ── Tab Definitions ──────────────────────────────────────────

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: 'content', label: 'Content', count: contentItems.length },
        { key: 'students', label: 'Students', count: students.length },
        { key: 'analytics', label: 'Analytics' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Course #{courseId}
                </h1>
                <p className="text-zinc-400">Manage content, grade students, and view analytics</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.key
                                ? 'text-white'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-sm ${activeTab === tab.key ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.key && (
                            <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Feedback Message */}
            {message.text && (
                <div className={`px-4 py-3 text-sm border ${message.type === 'success'
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                        : 'bg-red-950/50 text-red-400 border-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* ═══════════════════════════ CONTENT TAB ═══════════════════════════ */}
            {activeTab === 'content' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Add Content Form */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Add Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddContent} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="content-title" className="text-zinc-400">Title</Label>
                                    <Input
                                        id="content-title"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Lesson 1: Introduction"
                                        className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content-url" className="text-zinc-400">URL</Label>
                                    <Input
                                        id="content-url"
                                        type="url"
                                        required
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content-type" className="text-zinc-400">Type</Label>
                                    <select
                                        id="content-type"
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value)}
                                        className="flex h-9 w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="video">Video</option>
                                        <option value="book">Book</option>
                                        <option value="notes">Notes</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full">
                                    Add Content
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Content List */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">Course Content</h3>
                        {contentItems.length === 0 ? (
                            <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                                    No content added yet. Use the form to add materials.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {contentItems.map((item) => (
                                    <Card key={item.content_id} className="bg-zinc-900/50 border-zinc-800">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{getContentIcon(item.content_type)}</span>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{item.title}</p>
                                                    <p className="text-xs text-zinc-500">{item.content_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        Open ↗
                                                    </a>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteContent(item.content_id)}
                                                    className="text-zinc-500 hover:text-red-400 h-7 w-7 p-0"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ STUDENTS TAB ══════════════════════════ */}
            {activeTab === 'students' && (
                <div className="space-y-4">
                    {/* Bulk Operations Bar */}
                    {students.length > 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-500">
                                {students.length} student{students.length !== 1 ? 's' : ''} enrolled
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCopyEmails}
                                    className="border-zinc-700 text-zinc-400 hover:text-white text-xs">
                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    Copy Emails
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportCSV}
                                    className="border-zinc-700 text-zinc-400 hover:text-white text-xs">
                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    )}

                    {students.length === 0 ? (
                        <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                                <svg className="w-12 h-12 mb-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-sm font-medium">No students enrolled yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-400 font-medium">Name</TableHead>
                                        <TableHead className="text-zinc-400 font-medium">Email</TableHead>
                                        <TableHead className="text-zinc-400 font-medium">Score</TableHead>
                                        <TableHead className="text-zinc-400 font-medium text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.student_id} className="border-zinc-800/50">
                                            <TableCell className="text-white font-medium">{student.full_name}</TableCell>
                                            <TableCell className="text-zinc-400 text-sm">{student.email || 'N/A'}</TableCell>
                                            <TableCell>{getScoreBadge(student.evaluation_score)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setGradingStudent(student);
                                                        setGradeValue(student.evaluation_score?.toString() || '');
                                                        setGradeDialogOpen(true);
                                                    }}
                                                    className="text-zinc-500 hover:text-white h-7 px-2"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Grade
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>
            )}

            {/* ═══════════════════════════ ANALYTICS TAB ═════════════════════════ */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {!analytics ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics.total_students}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Total Students</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{analytics.pass_rate}%</p>
                                        <p className="text-xs text-zinc-500 mt-1">Pass Rate</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-amber-400">{analytics.at_risk_count}</p>
                                        <p className="text-xs text-zinc-500 mt-1">At Risk</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-sky-400">
                                            {analytics.avg_score !== null ? `${analytics.avg_score}%` : 'N/A'}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">Avg Score</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Score Distribution Chart (Pure CSS) */}
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-base text-white">Score Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(analytics.distribution).map(([bucket, count]) => {
                                            const maxCount = Math.max(...Object.values(analytics.distribution), 1);
                                            const percentage = (count / maxCount) * 100;
                                            const colors: Record<string, string> = {
                                                '0-20': 'bg-red-500',
                                                '21-40': 'bg-amber-500',
                                                '41-60': 'bg-yellow-500',
                                                '61-80': 'bg-sky-500',
                                                '81-100': 'bg-emerald-500',
                                            };
                                            return (
                                                <div key={bucket} className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-400 w-12 text-right font-mono">{bucket}</span>
                                                    <div className="flex-1 h-6 bg-zinc-800 overflow-hidden relative">
                                                        <div
                                                            className={`h-full ${colors[bucket] || 'bg-zinc-500'} transition-all duration-700 ease-out`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-zinc-300 w-6 font-mono">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pass / Fail Visual */}
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-base text-white">Pass / Fail Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="h-4 w-full bg-zinc-800 overflow-hidden flex">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-700"
                                                    style={{ width: `${analytics.pass_rate}%` }}
                                                />
                                                <div
                                                    className="h-full bg-red-500 transition-all duration-700"
                                                    style={{ width: `${100 - analytics.pass_rate}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 bg-emerald-500" />
                                                <span className="text-zinc-400">Pass ({analytics.pass_rate}%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 bg-red-500" />
                                                <span className="text-zinc-400">Fail ({(100 - analytics.pass_rate).toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════ GRADING DIALOG ════════════════════════ */}
            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Grade Student</DialogTitle>
                        <DialogDescription>
                            {gradingStudent
                                ? `Assign or update the evaluation score for ${gradingStudent.full_name}.`
                                : 'Select a student to grade.'}
                        </DialogDescription>
                    </DialogHeader>
                    {gradingStudent && (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Student</span>
                                <span className="text-white font-medium">{gradingStudent.full_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Current Score</span>
                                <span className="text-white">
                                    {gradingStudent.evaluation_score !== null
                                        ? `${gradingStudent.evaluation_score}%`
                                        : 'Not graded'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade-input" className="text-zinc-400">New Score (0–100)</Label>
                                <Input
                                    id="grade-input"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(e.target.value)}
                                    placeholder="Enter score..."
                                    className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradeDialogOpen(false)}
                            className="border-zinc-700 text-zinc-400">
                            Cancel
                        </Button>
                        <Button onClick={handleGradeSubmit} disabled={grading || gradeValue === ''}>
                            {grading ? 'Saving...' : 'Save Grade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
