'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SignupStudentPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [skillLevel, setSkillLevel] = useState('beginner');
    const [country, setCountry] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    age: parseInt(age, 10),
                    skill_level: skillLevel,
                    country,
                    password,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Registration failed');
            }
            router.push('/login?message=Account+created.+Please+sign+in.');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
            <div className="w-full max-w-md space-y-6">
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">Sign up as Student</CardTitle>
                        <CardDescription>Create an account to browse and apply for courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full name</Label>
                                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" type="number" min={13} required value={age} onChange={(e) => setAge(e.target.value)} className="bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" required value={country} onChange={(e) => setCountry(e.target.value)} className="bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="skillLevel">Skill level</Label>
                                <select id="skillLevel" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-white">
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/20" />
                            </div>
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}
                            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
                            <p className="text-center text-sm text-zinc-500">
                                Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
