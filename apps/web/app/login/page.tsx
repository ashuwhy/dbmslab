'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { setAuth, getRole } from '@/lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = useMemo(() => searchParams.get('message')?.replace(/\+/g, ' ') ?? null, [searchParams]);

    // If already logged in, redirect to dashboard or home (don't show login form)
    useEffect(() => {
        const role = getRole();
        if (role) {
            if (role === 'admin') router.replace('/admin');
            else if (role === 'student') router.replace('/student');
            else if (role === 'instructor') router.replace('/instructor');
            else if (role === 'analyst') router.replace('/analyst');
            else router.replace('/');
        } else {
            setCheckingAuth(false);
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.status === 403) {
                const data = await res.json().catch(() => ({}));
                if (data.detail === 'pending_approval') {
                    setError('Your account is pending admin approval. You will be able to sign in once an admin approves your registration.');
                    return;
                }
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Invalid credentials');
            }

            const data = await res.json();
            setAuth(data.access_token, data.role);

            if (data.role === 'admin') router.push('/admin');
            else if (data.role === 'student') router.push('/student');
            else if (data.role === 'instructor') router.push('/instructor');
            else if (data.role === 'analyst') router.push('/analyst');
            else router.push('/');

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
                <p className="text-zinc-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
            <div className="w-full max-w-md space-y-6">
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                        <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/20"
                                />
                            </div>

                            {message && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                                    {message}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            <div className="text-center text-sm text-zinc-500 pt-2">
                                Don&apos;t have an account?{' '}
                                <a href="/signup/student" className="text-blue-400 hover:underline">Sign up as Student</a>
                                {' · '}
                                <a href="/signup/instructor" className="text-blue-400 hover:underline">Instructor</a>
                                {' · '}
                                <a href="/signup/analyst" className="text-blue-400 hover:underline">Analyst</a>
                            </div>
                        </form>
                    </CardContent>
                    {/* <CardFooter className="flex-col space-y-4 border-t border-zinc-800 pt-6">
                        <div className="text-center text-xs text-zinc-500">
                            Demo credentials available for each role
                        </div>
                    </CardFooter> */}
                </Card>

                {/* <div className="grid grid-cols-4 gap-2 text-center text-xs text-zinc-500 opacity-50">
                    <div>Student</div>
                    <div>Instructor</div>
                    <div>Admin</div>
                    <div>Analyst</div>
                </div> */}
            </div>
        </div>
    );
}
