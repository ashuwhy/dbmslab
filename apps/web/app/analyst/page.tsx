'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

export default function AnalystPage() {
    const [popularCourse, setPopularCourse] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [avgScores, setAvgScores] = useState<any[]>([]);
    const [topStudent, setTopStudent] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const p1 = fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/most-popular-course`);
            const p2 = fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/enrollments-per-course`);
            const p3 = fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/avg-score-by-course`);
            const p4 = fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/top-indian-student-by-ai-average`);

            const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

            if (r1.ok) setPopularCourse(await r1.json());
            if (r2.ok) setEnrollments(await r2.json());
            if (r3.ok) setAvgScores(await r3.json());
            if (r4.ok) setTopStudent(await r4.json());
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Most Popular Course</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {popularCourse?.course || 'N/A'}
                            <span className="text-sm text-gray-500 font-normal ml-2">({popularCourse?.enrollments} enrollments)</span>
                        </dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Top Performing Student (AI)</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {topStudent?.name || 'N/A'}
                            <span className="text-sm text-gray-500 font-normal ml-2">(Avg: {topStudent?.avg_score?.toFixed(2)})</span>
                        </dd>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollments per Course</h3>
                    <ul className="divide-y divide-gray-200">
                        {enrollments.map((e: any) => (
                            <li key={e.course_id} className="py-4 flex justify-between">
                                <span className="text-sm font-medium text-gray-900">{e.title}</span>
                                <span className="text-sm text-gray-500">{e.count} students</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Average Scores</h3>
                    <ul className="divide-y divide-gray-200">
                        {avgScores.map((e: any) => (
                            <li key={e.course} className="py-4 flex justify-between">
                                <span className="text-sm font-medium text-gray-900">{e.course}</span>
                                <span className="text-sm text-gray-500">{e.avg_score?.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
