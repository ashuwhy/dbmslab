'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Dither from '@/components/Dither';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SignupInstructorPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [teachingYears, setTeachingYears] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register/instructor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    teaching_years: parseInt(teachingYears, 10),
                    password,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Registration failed');
            }
            router.push('/login?message=Registration+submitted.+You+can+sign+in+once+an+admin+approves+your+account.');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center py-12 px-4 overflow-hidden bg-black text-white">
            <div className="absolute inset-0 z-0">
                <Dither
                    waveColor={[0.56, 0.36, 1]}
                    disableAnimation={false}
                    enableMouseInteraction
                    mouseRadius={0.35}
                    colorNum={4}
                    pixelSize={2}
                    waveAmplitude={0.3}
                    waveFrequency={3}
                    waveSpeed={0.05}
                />
            </div>
            <div className="w-full max-w-md space-y-6 relative z-10">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl text-white shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">Sign up as Instructor</CardTitle>
                        <CardDescription>Register to create courses. Your account will be reviewed by an admin.</CardDescription>
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
                                <Label htmlFor="teachingYears">Years of teaching experience</Label>
                                <Input id="teachingYears" type="number" min={0} required value={teachingYears} onChange={(e) => setTeachingYears(e.target.value)} className="bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/20" />
                            </div>
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}
                            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit registration'}</Button>
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
