'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface User {
    id: number;
    email: string;
    role: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [country, setCountry] = useState('');
    const [skillLevel, setSkillLevel] = useState('beginner');
    const [teachingYears, setTeachingYears] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/users`);
            if (res.ok) setUsers(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const body: Record<string, string | number> = { email, password, role };
            if (role === 'student') {
                body.full_name = fullName;
                body.age = parseInt(age);
                body.country = country;
                body.skill_level = skillLevel;
            } else if (role === 'instructor') {
                body.full_name = fullName;
                body.teaching_years = parseInt(teachingYears);
            }

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setMessage('User created successfully');
                setEmail('');
                setPassword('');
                setFullName('');
                setAge('');
                setCountry('');
                setTeachingYears('');
                loadUsers();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to create user');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                loadUsers();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
            admin: 'destructive',
            instructor: 'secondary',
            student: 'default',
            analyst: 'outline',
        };
        return variants[role] || 'default';
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
                <p className="text-zinc-400">Create and manage user accounts</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Create User Form */}
                <Card className="lg:col-span-1 h-fit bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Create User</CardTitle>
                        <CardDescription>Add a new user to the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="bg-black/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-black/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-9 w-full rounded-none border border-input bg-black/20 px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-zinc-100"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="student" className="bg-zinc-900">Student</option>
                                    <option value="instructor" className="bg-zinc-900">Instructor</option>
                                    <option value="admin" className="bg-zinc-900">Admin</option>
                                    <option value="analyst" className="bg-zinc-900">Analyst</option>
                                </select>
                            </div>

                            {role === 'student' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input
                                            id="age"
                                            type="number"
                                            required
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            placeholder="20"
                                            className="bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            required
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            placeholder="India"
                                            className="bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="skillLevel">Skill Level</Label>
                                        <select
                                            id="skillLevel"
                                            className="flex h-9 w-full rounded-none border border-input bg-black/20 px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-zinc-100"
                                            value={skillLevel}
                                            onChange={(e) => setSkillLevel(e.target.value)}
                                        >
                                            <option value="beginner" className="bg-zinc-900">Beginner</option>
                                            <option value="intermediate" className="bg-zinc-900">Intermediate</option>
                                            <option value="advanced" className="bg-zinc-900">Advanced</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {role === 'instructor' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Prof. Jane Doe"
                                            className="bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="teachingYears">Teaching Experience (Years)</Label>
                                        <Input
                                            id="teachingYears"
                                            type="number"
                                            required
                                            value={teachingYears}
                                            onChange={(e) => setTeachingYears(e.target.value)}
                                            placeholder="5"
                                            className="bg-black/20"
                                        />
                                    </div>
                                </>
                            )}
                            <Button type="submit" className="w-full">
                                Create User
                            </Button>
                        </form>
                        {message && (
                            <p className={`mt-4 text-sm font-medium ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                {message}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Users List */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>Total users: {users.length}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/20">
                                            <TableCell className="font-medium text-zinc-500">#{user.id}</TableCell>
                                            <TableCell className="text-zinc-100">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadge(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="h-7 px-3 text-xs"
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
