'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, StarIcon, Award01Icon, PartyIcon } from '@hugeicons/core-free-icons';
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

// New Interfaces for Reports
interface ModuleAnalytics {
    program_id: string;
    avg_score: number;
    students: number;
}

interface InstructorPerformance {
    instructor: string;
    topic: string;
    instructor_avg: number;
    global_topic_avg: number;
    ipi: number;
}

interface AtRiskStudent {
    student_id: number;
    name: string;
    email: string;
    avg_score: number;
}

interface TopicTrend {
    topic: string;
    enrollments: number;
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

    // New State for Reports
    const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics[]>([]);
    const [instructorPerformance, setInstructorPerformance] = useState<InstructorPerformance[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
    const [topicTrends, setTopicTrends] = useState<TopicTrend[]>([]);

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
                    '/analytics/top-courses?limit=5',
                    // New Report Endpoints
                    '/reports/module-analytics',
                    '/reports/instructor-performance',
                    '/reports/at-risk-students?threshold=50', // Adjusted threshold example
                    '/reports/topic-trends'
                ];

                const responses = await Promise.all(
                    endpoints.map(ep =>
                        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${ep}`)
                    )
                );

                const [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12] = responses;

                if (r0.ok) setStats(await r0.json());
                if (r1.ok) setPopularCourse(await r1.json());
                if (r2.ok) setEnrollments(await r2.json());
                if (r3.ok) setAvgScores(await r3.json());
                if (r4.ok) setTopStudent(await r4.json());
                if (r5.ok) setByUniversity(await r5.json());
                if (r6.ok) setByCountry(await r6.json());
                if (r7.ok) setBySkill(await r7.json());
                if (r8.ok) setTopCourses(await r8.json());

                // Set New Report Data
                if (r9.ok) setModuleAnalytics(await r9.json());
                if (r10.ok) setInstructorPerformance(await r10.json());
                if (r11.ok) setAtRiskStudents(await r11.json());
                if (r12.ok) setTopicTrends(await r12.json());

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
    const maxTopicEnrollment = Math.max(...topicTrends.map(t => t.enrollments), 1);

    return (
        <div className="space-y-8 pb-10">
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

            {/* 🔥 NEW REPORTS SECTION STARTS HERE 🔥 */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-white">Advanced Reports</h2>
                <p className="text-zinc-400">In-depth analysis of module performance, instructor effectiveness, and student risks.</p>
            </div>

            {/* Module Analytics & Topic Trends */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Module Analytics (Cohort Analysis) */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Module Performance (Cohort Analysis)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead>Program</TableHead>
                                    <TableHead className="text-right">Students</TableHead>
                                    <TableHead className="text-right">Avg Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moduleAnalytics.map((m, i) => (
                                    <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/20">
                                        <TableCell className="text-white font-medium">{m.program_id}</TableCell>
                                        <TableCell className="text-right text-zinc-400">{m.students}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={m.avg_score >= 80 ? 'default' : 'secondary'}>
                                                {m.avg_score}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Topic Trends */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Topic Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topicTrends.slice(0, 8).map((t, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white truncate max-w-[200px]">{t.topic}</span>
                                    <span className="text-zinc-500">{t.enrollments}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-none overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500" // Different color for distinction
                                        style={{ width: `${(t.enrollments / maxTopicEnrollment) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Instructor Performance Index */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg">Instructor Performance Index (IPI)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead>Instructor</TableHead>
                                <TableHead>Topic</TableHead>
                                <TableHead className="text-right">Inst. Avg</TableHead>
                                <TableHead className="text-right">Global Avg</TableHead>
                                <TableHead className="text-right">IPI Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {instructorPerformance.map((ip, i) => (
                                <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/20">
                                    <TableCell className="text-white font-medium">{ip.instructor}</TableCell>
                                    <TableCell className="text-zinc-400">{ip.topic}</TableCell>
                                    <TableCell className="text-right text-zinc-300">{ip.instructor_avg}%</TableCell>
                                    <TableCell className="text-right text-zinc-500">{ip.global_topic_avg}%</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            className={
                                                ip.ipi > 1.1 ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                                                    ip.ipi < 0.9 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                        'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }
                                        >
                                            {ip.ipi}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* At-Risk Students */}
            <Card className="bg-red-950/20 border-red-900/50">
                <CardHeader>
                    <CardTitle className="text-lg text-red-400 flex items-center gap-2">
                        <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5" /> At-Risk Students <span className="text-sm font-normal text-zinc-500">(Avg Score &lt; 50%)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-red-900/30 hover:bg-transparent">
                                <TableHead className="text-zinc-400">Student Name</TableHead>
                                <TableHead className="text-zinc-400">Email</TableHead>
                                <TableHead className="text-right text-zinc-400">Avg Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {atRiskStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-zinc-500 py-4 flex flex-col items-center gap-2">
                                        No at-risk students found. Great job! <HugeiconsIcon icon={PartyIcon} className="w-5 h-5 text-yellow-500" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                atRiskStudents.map((s, i) => (
                                    <TableRow key={i} className="border-red-900/30 hover:bg-red-900/10">
                                        <TableCell className="text-white font-medium">{s.name}</TableCell>
                                        <TableCell className="text-zinc-400">{s.email}</TableCell>
                                        <TableCell className="text-right text-red-400 font-bold">
                                            {s.avg_score}%
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><HugeiconsIcon icon={Award01Icon} className="w-4 h-4" /> Most Popular Course</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">{popularCourse?.course || 'N/A'}</p>
                        <p className="text-sm text-zinc-500 mt-1">{popularCourse?.enrollments || 0} enrollments</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><HugeiconsIcon icon={StarIcon} className="w-4 h-4" /> Top Indian AI Student</CardTitle>
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
        </div >
    );
}
