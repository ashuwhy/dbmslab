'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface Course {
    course_id: number;
    course_name: string;
    duration_weeks: number;
    university_name: string | null;
    program_name: string | null;
    enrollment_count: number;
    instructor_names: string | null;
    topic_ids?: number[];
}

interface Instructor {
    instructor_id: number;
    full_name: string;
    email: string | null;
}

interface University {
    university_id: number;
    name: string;
    country?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [programs, setPrograms] = useState<{ program_id: number; program_name: string }[]>([]);
    const [textbooks, setTextbooks] = useState<{ textbook_id: number; title: string }[]>([]);
    const [topics, setTopics] = useState<{ topic_id: number; topic_name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    // Create course form
    const [createCourseName, setCreateCourseName] = useState('');
    const [createDuration, setCreateDuration] = useState('');
    const [createUniversityId, setCreateUniversityId] = useState('');
    const [createProgramId, setCreateProgramId] = useState('');
    const [createTextbookId, setCreateTextbookId] = useState('');
    const [createCapacity, setCreateCapacity] = useState('100');
    const [createTopicIds, setCreateTopicIds] = useState<number[]>([]);
    const [createUniversityName, setCreateUniversityName] = useState('');
    const [createUniversityCountry, setCreateUniversityCountry] = useState('');

    // Manage Instructors State
    const [managingCourse, setManagingCourse] = useState<Course | null>(null);
    const [assignedInstructors, setAssignedInstructors] = useState<Instructor[]>([]);

    // Edit Course State
    const [editingDetailsCourse, setEditingDetailsCourse] = useState<Course | null>(null);

    const fetchData = async () => {
        try {
            const [coursesRes, instructorsRes, uRes, pRes, tRes, topicsRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/admin/courses`),
                fetchWithAuth(`${API_URL}/admin/instructors`),
                fetchWithAuth(`${API_URL}/admin/universities`),
                fetchWithAuth(`${API_URL}/admin/programs`),
                fetchWithAuth(`${API_URL}/admin/textbooks`),
                fetchWithAuth(`${API_URL}/admin/topics`),
            ]);

            if (coursesRes.ok) setCourses(await coursesRes.json());
            if (instructorsRes.ok) setInstructors(await instructorsRes.json());
            if (uRes.ok) setUniversities(await uRes.json());
            if (pRes.ok) setPrograms(await pRes.json());
            if (tRes.ok) setTextbooks(await tRes.json());
            if (topicsRes.ok) setTopics(await topicsRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_name: createCourseName,
                    duration_weeks: parseInt(createDuration, 10),
                    university_id: parseInt(createUniversityId, 10),
                    program_id: parseInt(createProgramId, 10),
                    textbook_id: parseInt(createTextbookId, 10),
                    max_capacity: parseInt(createCapacity, 10) || 100,
                    topic_ids: createTopicIds,
                }),
            });
            if (res.ok) {
                setMessage('Course created');
                setCreateCourseName('');
                setCreateDuration('');
                setCreateUniversityId('');
                setCreateProgramId('');
                setCreateTextbookId('');
                setCreateCapacity('100');
                fetchData();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to create course');
        }
    };

    const handleCreateUniversity = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/universities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: createUniversityName,
                    country: createUniversityCountry,
                }),
            });

            if (res.ok) {
                setMessage('University created');
                setCreateUniversityName('');
                setCreateUniversityCountry('');
                fetchData();
                return;
            }

            const err = await res.json();
            setMessage(`Error: ${err.detail || 'Failed to create university'}`);
        } catch {
            setMessage('Failed to create university');
        }
    };

    const handleAssign = async () => {
        if (!selectedCourse || !selectedInstructor) return;
        setMessage('');

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/courses/${selectedCourse}/assign-instructor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instructor_id: selectedInstructor, role: 'instructor' }),
            });

            if (res.ok) {
                setMessage('Instructor assigned successfully');
                setSelectedCourse(null);
                setSelectedInstructor(null);
                fetchData();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to assign instructor');
        }
    };

    const openManageInstructors = async (course: Course) => {
        setManagingCourse(course);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/course-assignments/${course.course_id}`);
            if (res.ok) {
                setAssignedInstructors(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        }
    };

    const removeInstructor = async (instructorId: number) => {
        if (!managingCourse) return;
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/courses/${managingCourse.course_id}/instructors/${instructorId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Remove from local list
                setAssignedInstructors(prev => prev.filter(i => i.instructor_id !== instructorId));
                // Update main list to reflect changes in "Instructors" column
                fetchData();
            }
        } catch (error) {
            console.error("Failed to remove instructor", error);
        }
    };

    const handleUpdateDetails = async () => {
        if (!editingDetailsCourse) return;

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/courses/${editingDetailsCourse.course_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_name: editingDetailsCourse.course_name,
                    duration_weeks: editingDetailsCourse.duration_weeks,
                    topic_ids: editingDetailsCourse.topic_ids ?? [],
                }),
            });

            if (res.ok) {
                setMessage('Course updated successfully');
                setEditingDetailsCourse(null);
                fetchData(); // Refresh list
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to update course');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Course Management</h1>
                <p className="text-zinc-400">View courses and assign instructors</p>
            </div>

            {message && (
                <p className={`text-sm font-medium ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
            )}

            {/* Create Course */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>Create Course</CardTitle>
                    <CardDescription>Add a new course. You can then assign instructors from the list below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateCourse} className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                        <div className="space-y-2">
                            <Label>Course name</Label>
                            <Input value={createCourseName} onChange={(e) => setCreateCourseName(e.target.value)} required className="bg-black/20" />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (weeks)</Label>
                            <Input type="number" min={1} value={createDuration} onChange={(e) => setCreateDuration(e.target.value)} required className="bg-black/20" />
                        </div>
                        <div className="space-y-2">
                            <Label>University</Label>
                            <select value={createUniversityId} onChange={(e) => setCreateUniversityId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                <option value="">Select</option>
                                {universities.map((u) => (
                                    <option key={u.university_id} value={u.university_id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Program</Label>
                            <select value={createProgramId} onChange={(e) => setCreateProgramId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                <option value="">Select</option>
                                {programs.map((p) => (
                                    <option key={p.program_id} value={p.program_id}>{p.program_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Textbook</Label>
                            <select value={createTextbookId} onChange={(e) => setCreateTextbookId(e.target.value)} required className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                <option value="">Select</option>
                                {textbooks.map((t) => (
                                    <option key={t.textbook_id} value={t.textbook_id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Max capacity</Label>
                            <Input type="number" min={1} value={createCapacity} onChange={(e) => setCreateCapacity(e.target.value)} className="bg-black/20" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-6 space-y-2">
                            <Label>Topics</Label>
                            <div className="flex flex-wrap gap-2">
                                {topics.map((t) => (
                                    <label key={t.topic_id} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                                        <input
                                            type="checkbox"
                                            checked={createTopicIds.includes(t.topic_id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setCreateTopicIds((prev) => [...prev, t.topic_id]);
                                                else setCreateTopicIds((prev) => prev.filter((id) => id !== t.topic_id));
                                            }}
                                            className="rounded border-zinc-600 bg-zinc-900"
                                        />
                                        {t.topic_name}
                                    </label>
                                ))}
                                {topics.length === 0 && <span className="text-zinc-500 text-sm">No topics yet. Approve topic proposals first.</span>}
                            </div>
                        </div>
                        <div className="md:col-span-2 lg:col-span-6">
                            <Button type="submit">Create course</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Create University */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>Create University</CardTitle>
                    <CardDescription>Add a university for course mapping.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateUniversity} className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-1">
                            <Label>University name</Label>
                            <Input
                                value={createUniversityName}
                                onChange={(e) => setCreateUniversityName(e.target.value)}
                                required
                                className="bg-black/20"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                            <Label>Country</Label>
                            <Input
                                value={createUniversityCountry}
                                onChange={(e) => setCreateUniversityCountry(e.target.value)}
                                required
                                className="bg-black/20"
                            />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                            <Button type="submit" className="w-full">Create university</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Assign Instructor */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>Assign Instructor to Course</CardTitle>
                    <CardDescription>Select a course and an instructor to assign them.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="course">Select Course</Label>
                            <select
                                id="course"
                                className="flex h-9 w-full rounded-none border border-input bg-black/20 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-zinc-100"
                                value={selectedCourse || ''}
                                onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
                            >
                                <option value="" className="bg-zinc-900">Choose a course...</option>
                                {courses.map((c) => (
                                    <option key={c.course_id} value={c.course_id} className="bg-zinc-900">
                                        {c.course_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructor">Select Instructor</Label>
                            <select
                                id="instructor"
                                className="flex h-9 w-full rounded-none border border-input bg-black/20 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-zinc-100"
                                value={selectedInstructor || ''}
                                onChange={(e) => setSelectedInstructor(Number(e.target.value) || null)}
                            >
                                <option value="" className="bg-zinc-900">Choose an instructor...</option>
                                {instructors.map((i) => (
                                    <option key={i.instructor_id} value={i.instructor_id} className="bg-zinc-900">
                                        {i.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedCourse || !selectedInstructor}
                            className="w-full"
                        >
                            Assign
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Courses List */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>All Courses</CardTitle>
                    <CardDescription>Total courses: {courses.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Instructors</TableHead>
                                <TableHead>University</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Enrollments</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <TableRow key={course.course_id} className="border-zinc-800 hover:bg-zinc-800/20">
                                    <TableCell className="font-medium text-zinc-500">#{course.course_id}</TableCell>
                                    <TableCell className="text-zinc-100 font-medium">{course.course_name}</TableCell>
                                    <TableCell className="text-zinc-300">
                                        {course.instructor_names ? (
                                            <Badge
                                                variant="outline"
                                                className="border-zinc-700 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800"
                                                onClick={() => openManageInstructors(course)}
                                            >
                                                {course.instructor_names}
                                            </Badge>
                                        ) : (
                                            <span
                                                className="text-zinc-600 text-sm cursor-pointer hover:text-zinc-400"
                                                onClick={() => openManageInstructors(course)}
                                            >
                                                Manage
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-400">{course.university_name || 'N/A'}</TableCell>
                                    <TableCell className="text-zinc-400">{course.program_name || 'N/A'}</TableCell>
                                    <TableCell className="text-zinc-400">{course.duration_weeks} weeks</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="secondary">{course.enrollment_count}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                const res = await fetchWithAuth(`${API_URL}/admin/courses/${course.course_id}`);
                                                if (res.ok) {
                                                    const full = await res.json();
                                                    setEditingDetailsCourse({ ...course, ...full, topic_ids: full.topic_ids ?? [] });
                                                } else {
                                                    setEditingDetailsCourse(course);
                                                }
                                            }}
                                            className="h-7 px-3 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!managingCourse} onOpenChange={(open) => !open && setManagingCourse(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Instructors</DialogTitle>
                        <DialogDescription>
                            Instructors assigned to <span className="text-white font-medium">{managingCourse?.course_name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[200px] w-full rounded-md border border-zinc-800 p-4 bg-zinc-900/50">
                        {assignedInstructors.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                                No instructors assigned.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assignedInstructors.map((instructor) => (
                                    <div key={instructor.instructor_id} className="flex items-center justify-between p-2 rounded-none bg-zinc-900 border border-zinc-800">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-zinc-100">{instructor.full_name}</span>
                                            <span className="text-xs text-zinc-500">{instructor.email}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                            onClick={() => removeInstructor(instructor.instructor_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setManagingCourse(null)} className="w-full">Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingDetailsCourse} onOpenChange={(open) => !open && setEditingDetailsCourse(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>Edit course details.</DialogDescription>
                    </DialogHeader>
                    {editingDetailsCourse && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="course_name" className="text-right">Name</Label>
                                <Input
                                    id="course_name"
                                    value={editingDetailsCourse.course_name}
                                    onChange={(e) => setEditingDetailsCourse({ ...editingDetailsCourse, course_name: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="duration" className="text-right">Weeks</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={editingDetailsCourse.duration_weeks}
                                    onChange={(e) => setEditingDetailsCourse({ ...editingDetailsCourse, duration_weeks: parseInt(e.target.value) || 0 })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Topics</Label>
                                <div className="col-span-3 flex flex-wrap gap-2">
                                    {topics.map((t) => (
                                        <label key={t.topic_id} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                                            <input
                                                type="checkbox"
                                                checked={(editingDetailsCourse.topic_ids ?? []).includes(t.topic_id)}
                                                onChange={(e) => {
                                                    const ids = editingDetailsCourse.topic_ids ?? [];
                                                    if (e.target.checked) setEditingDetailsCourse({ ...editingDetailsCourse, topic_ids: [...ids, t.topic_id] });
                                                    else setEditingDetailsCourse({ ...editingDetailsCourse, topic_ids: ids.filter((id) => id !== t.topic_id) });
                                                }}
                                                className="rounded border-zinc-600 bg-zinc-900"
                                            />
                                            {t.topic_name}
                                        </label>
                                    ))}
                                    {topics.length === 0 && <span className="text-zinc-500 text-sm">No topics.</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingDetailsCourse(null)} className="rounded-none border-zinc-700">Cancel</Button>
                        <Button type="submit" onClick={handleUpdateDetails} className="rounded-none">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
