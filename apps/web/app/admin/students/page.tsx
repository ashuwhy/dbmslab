'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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

    const handleUpdate = async () => {
        if (!editingStudent) return;

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/students/${editingStudent.student_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editingStudent.full_name,
                    email: editingStudent.email,
                    country: editingStudent.country,
                    age: editingStudent.age,
                    skill_level: editingStudent.skill_level
                }),
            });

            if (res.ok) {
                setMessage('Student updated successfully');
                setEditingStudent(null);
                loadStudents();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to update student');
        }
    };

    const getSkillBadgeVariant = (level: string | null): "default" | "secondary" | "outline" | "destructive" => {
        if (!level) return 'secondary';
        switch (level.toLowerCase()) {
            case 'advanced': return 'default';
            case 'intermediate': return 'secondary';
            default: return 'outline';
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
                <h1 className="text-3xl font-bold tracking-tight text-white">Student Management</h1>
                <p className="text-zinc-400">View and manage all students</p>
            </div>

            {message && (
                <div className={`p-4 rounded-none border ${message.includes('Error') ? 'border-red-900/50 bg-red-900/20 text-red-400' : 'border-green-900/50 bg-green-900/20 text-green-400'}`}>
                    {message}
                </div>
            )}

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>Total students: {students.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Skill Level</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student.student_id} className="border-zinc-800 hover:bg-zinc-800/20">
                                    <TableCell className="font-medium text-zinc-500">#{student.student_id}</TableCell>
                                    <TableCell className="text-zinc-100 font-medium">{student.full_name}</TableCell>
                                    <TableCell className="text-zinc-400">{student.email || 'N/A'}</TableCell>
                                    <TableCell className="text-zinc-400">{student.country}</TableCell>
                                    <TableCell className="text-zinc-400">{student.age}</TableCell>
                                    <TableCell>
                                        <Badge variant={getSkillBadgeVariant(student.skill_level)}>
                                            {student.skill_level || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingStudent(student)}
                                            className="h-7 px-3 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(student.student_id)}
                                            className="h-7 px-3 text-xs"
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Student</DialogTitle>
                        <DialogDescription>
                            Make changes to the student&apos;s profile here. Click save when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>
                    {editingStudent && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={editingStudent.full_name}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    value={editingStudent.email || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="country" className="text-right">
                                    Country
                                </Label>
                                <Input
                                    id="country"
                                    value={editingStudent.country}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, country: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="age" className="text-right">
                                    Age
                                </Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={editingStudent.age}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, age: parseInt(e.target.value) || 0 })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="skill" className="text-right">
                                    Skill Level
                                </Label>
                                <select // Native select for simplicity
                                    id="skill"
                                    className="flex h-9 w-full rounded-none border border-input bg-zinc-900 px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 col-span-3 border-zinc-700 text-zinc-100"
                                    value={editingStudent.skill_level || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, skill_level: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingStudent(null)} className="rounded-none border-zinc-700">Cancel</Button>
                        <Button type="submit" onClick={handleUpdate} className="rounded-none">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
