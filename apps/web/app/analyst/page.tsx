'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

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
                <div className="loading"></div>
            </div>
        );
    }

    const maxEnrollment = Math.max(...enrollments.map(e => e.count), 1);

    return (
        <div className="space-y-8">
            <div className="section-header">
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-zinc-400 mt-1">Platform statistics and insights</p>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <div className="card">
                    <p className="card-header">Total Courses</p>
                    <p className="card-value">{stats?.total_courses || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Total Students</p>
                    <p className="card-value">{stats?.total_students || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Total Enrollments</p>
                    <p className="card-value">{stats?.total_enrollments || 0}</p>
                </div>
                <div className="card">
                    <p className="card-header">Avg Score</p>
                    <p className="card-value">{stats?.average_score || 0}%</p>
                </div>
            </div>

            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="card">
                    <p className="card-header">🏆 Most Popular Course</p>
                    <p className="text-2xl font-bold text-white mt-2">{popularCourse?.course || 'N/A'}</p>
                    <p className="text-sm text-zinc-500 mt-1">{popularCourse?.enrollments || 0} enrollments</p>
                </div>
                <div className="card">
                    <p className="card-header">⭐ Top Indian AI Student</p>
                    <p className="text-2xl font-bold text-white mt-2">{topStudent?.name || 'N/A'}</p>
                    <p className="text-sm text-zinc-500 mt-1">Average: {topStudent?.avg_score || 0}%</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Enrollments Bar Chart */}
                <div className="card">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Enrollments per Course</h3>
                    <div className="space-y-3">
                        {enrollments.slice(0, 6).map((e) => (
                            <div key={e.course_id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white truncate max-w-[200px]">{e.title}</span>
                                    <span className="text-zinc-500">{e.count}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${(e.count / maxEnrollment) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Average Scores */}
                <div className="card">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Average Scores by Course</h3>
                    <div className="space-y-3">
                        {avgScores.slice(0, 6).map((e, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm text-white truncate max-w-[200px]">{e.course}</span>
                                <span className={`badge ${e.avg_score >= 80 ? 'badge-success' : e.avg_score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                                    {e.avg_score}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* By University */}
                <div className="card">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Courses by University</h3>
                    <div className="space-y-2">
                        {byUniversity.map((u, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-sm text-white">{u.university}</span>
                                <span className="text-sm text-zinc-500">{u.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Country */}
                <div className="card">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Students by Country</h3>
                    <div className="space-y-2">
                        {byCountry.map((c, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-sm text-white">{c.country}</span>
                                <span className="text-sm text-zinc-500">{c.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Skill Level */}
                <div className="card">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Skill Level Distribution</h3>
                    <div className="space-y-2">
                        {bySkill.map((s, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-sm text-white capitalize">{s.skill_level}</span>
                                <span className="text-sm text-zinc-500">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Courses Table */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Top 5 Courses</h3>
                <div className="card p-0 overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Course Name</th>
                                <th>Enrollments</th>
                                <th>Avg Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCourses.map((course, i) => (
                                <tr key={course.course_id}>
                                    <td className="text-zinc-400">#{i + 1}</td>
                                    <td className="text-white font-medium">{course.course_name}</td>
                                    <td>
                                        <span className="badge badge-primary">{course.enrollments}</span>
                                    </td>
                                    <td>
                                        {course.avg_score ? (
                                            <span className={`badge ${course.avg_score >= 80 ? 'badge-success' : 'badge-warning'}`}>
                                                {course.avg_score}%
                                            </span>
                                        ) : (
                                            <span className="text-zinc-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
