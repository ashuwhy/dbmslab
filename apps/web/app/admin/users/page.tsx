'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

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
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/users`, {
                method: 'POST',
                body: JSON.stringify({ email, password, role }),
            });

            if (res.ok) {
                setMessage('User created successfully');
                setEmail('');
                setPassword('');
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
        const styles: Record<string, string> = {
            admin: 'badge-danger',
            instructor: 'badge-primary',
            student: 'badge-success',
            analyst: 'badge-warning',
        };
        return styles[role] || 'badge-primary';
    };

    return (
        <div className="space-y-6">
            <div className="section-header">
                <h1 className="section-title">User Management</h1>
                <p className="section-description">Create and manage user accounts</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Create User Form */}
                <div className="card lg:col-span-1">
                    <h3 className="text-lg font-semibold text-white mb-4">Create User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Role</label>
                            <select
                                className="input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="admin">Admin</option>
                                <option value="analyst">Analyst</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary w-full">
                            Create User
                        </button>
                    </form>
                    {message && (
                        <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Users List */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">All Users ({users.length})</h3>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="loading"></div>
                        </div>
                    ) : (
                        <div className="card p-0 overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="text-zinc-400">#{user.id}</td>
                                            <td className="text-white">{user.email}</td>
                                            <td>
                                                <span className={`badge ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
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
                    )}
                </div>
            </div>
        </div>
    );
}
