'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Instructor {
    instructor_id: number;
    full_name: string;
    email: string | null;
}

export default function AdminInstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [message, setMessage] = useState('');

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

    useEffect(() => {
        loadInstructors();
    }, []);

    const handleUpdate = async () => {
        if (!editingInstructor) return;

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/instructors/${editingInstructor.instructor_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editingInstructor.full_name,
                    email: editingInstructor.email,
                }),
            });

            if (res.ok) {
                setMessage('Instructor updated successfully');
                setEditingInstructor(null);
                loadInstructors();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to update instructor');
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
                <h1 className="text-3xl font-bold tracking-tight text-white">Instructor Management</h1>
                <p className="text-zinc-400">View all instructors</p>
            </div>

            {message && (
                <div className={`p-4 rounded-none border ${message.includes('Error') ? 'border-red-900/50 bg-red-900/20 text-red-400' : 'border-green-900/50 bg-green-900/20 text-green-400'}`}>
                    {message}
                </div>
            )}

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle>All Instructors</CardTitle>
                    <CardDescription>Total instructors: {instructors.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    {instructors.length === 0 ? (
                        <div className="flex h-[200px] flex-col items-center justify-center space-y-3 border-dashed border border-zinc-800 rounded-none bg-zinc-950/50">
                            <p className="text-sm text-zinc-400">No instructors found in the database.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {instructors.map((instructor) => (
                                    <TableRow key={instructor.instructor_id} className="border-zinc-800 hover:bg-zinc-800/20">
                                        <TableCell className="font-medium text-zinc-500">#{instructor.instructor_id}</TableCell>
                                        <TableCell className="text-zinc-100 font-medium">{instructor.full_name}</TableCell>
                                        <TableCell className="text-zinc-400">{instructor.email || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingInstructor(instructor)}
                                                className="h-7 px-3 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                            >
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editingInstructor} onOpenChange={(open) => !open && setEditingInstructor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Instructor</DialogTitle>
                        <DialogDescription>
                            Make changes to the instructor's profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    {editingInstructor && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={editingInstructor.full_name}
                                    onChange={(e) => setEditingInstructor({ ...editingInstructor, full_name: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    value={editingInstructor.email || ''}
                                    onChange={(e) => setEditingInstructor({ ...editingInstructor, email: e.target.value })}
                                    className="col-span-3 bg-zinc-900 border-zinc-700"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingInstructor(null)} className="rounded-none border-zinc-700">Cancel</Button>
                        <Button type="submit" onClick={handleUpdate} className="rounded-none">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
