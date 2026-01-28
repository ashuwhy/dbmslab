'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface Stats {
    total_courses: number;
    total_students: number;
    total_enrollments: number;
    average_score: number;
}

interface EnrollmentData {
    course_id: number;
    title: string;
    count: number;
}

interface ScoreData {
    course: string;
    avg_score: number;
}

interface UniversityData {
    university: string;
    count: number;
}

interface CountryData {
    country: string;
    count: number;
}

interface SkillData {
    skill_level: string;
    count: number;
}

interface TopCourse {
    course_id: number;
    course_name: string;
    enrollments: number;
    avg_score: number | null;
}

export default function AnalystPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [popularCourse, setPopularCourse] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
    const [avgScores, setAvgScores] = useState<ScoreData[]>([]);
    const [topStudent, setTopStudent] = useState<any>(null);
    const [byUniversity, setByUniversity] = useState<UniversityData[]>([]);
    const [byCountry, setByCountry] = useState<CountryData[]>([]);
    const [bySkill, setBySkill] = useState<SkillData[]>([]);
    const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoints = [
                    '/analytics/stats',
                    '/analytics/most-popular-course',
                    '/analytics/enrollments-per-course',
                    '/analytics/avg-score-by-course',
                    '/analytics/top-indian-student-by-ai-average',
                    '/analytics/courses-by-university',
                    '/analytics/students-by-country',
                    '/analytics/skill-level-distribution',
                    '/analytics/top-courses?limit=5'
                ];

                const responses = await Promise.all(
                    endpoints.map(ep =>
                        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${ep}`)
                    )
                );

                const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = responses;

                if (r0.ok) setStats(await r0.json());
                if (r1.ok) setPopularCourse(await r1.json());
                if (r2.ok) setEnrollments(await r2.json());
                if (r3.ok) setAvgScores(await r3.json());
                if (r4.ok) setTopStudent(await r4.json());
                if (r5.ok) setByUniversity(await r5.json());
                if (r6.ok) setByCountry(await r6.json());
                if (r7.ok) setBySkill(await r7.json());
                if (r8.ok) setTopCourses(await r8.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    const maxEnrollment = Math.max(...enrollments.map(e => e.count), 1);

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
                <p className="text-zinc-400">Platform statistics and insights</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_courses || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_students || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_enrollments || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Avg Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.average_score || 0}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-400">🏆 Most Popular Course</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">{popularCourse?.course || 'N/A'}</p>
                        <p className="text-sm text-zinc-500 mt-1">{popularCourse?.enrollments || 0} enrollments</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-400">⭐ Top Indian AI Student</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">{topStudent?.name || 'N/A'}</p>
                        <p className="text-sm text-zinc-500 mt-1">Average: {topStudent?.avg_score || 0}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Enrollments Bar Chart */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Enrollments per Course</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {enrollments.slice(0, 6).map((e) => (
                            <div key={e.course_id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white truncate max-w-[200px]">{e.title}</span>
                                    <span className="text-zinc-500">{e.count}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-none overflow-hidden">
                                    <div
                                        className="h-full bg-white"
                                        style={{ width: `${(e.count / maxEnrollment) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Average Scores */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Average Scores by Course</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {avgScores.slice(0, 6).map((e, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm text-white truncate max-w-[200px]">{e.course}</span>
                                <Badge variant={e.avg_score >= 80 ? 'default' : e.avg_score >= 60 ? 'secondary' : 'destructive'}>
                                    {e.avg_score}%
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Charts */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Universities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {byUniversity.map((u, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-white">{u.university}</span>
                                <span className="text-zinc-500">{u.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Countries</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {byCountry.map((c, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-white">{c.country}</span>
                                <span className="text-zinc-500">{c.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Skill Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {bySkill.map((s, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-white capitalize">{s.skill_level}</span>
                                <span className="text-zinc-500">{s.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Top Courses Table */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg">Top 5 Courses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Enrollments</TableHead>
                                <TableHead className="text-right">Avg Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topCourses.map((course, i) => (
                                <TableRow key={course.course_id} className="border-zinc-800 hover:bg-zinc-800/20">
                                    <TableCell className="font-medium text-zinc-500">#{i + 1}</TableCell>
                                    <TableCell className="text-white font-medium">{course.course_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{course.enrollments}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {course.avg_score ? (
                                            <Badge variant={course.avg_score >= 80 ? 'default' : 'secondary'}>
                                                {course.avg_score}%
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-500">N/A</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
