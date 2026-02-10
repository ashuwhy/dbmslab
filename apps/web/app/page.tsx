'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getRole } from '@/lib/auth';

import { HugeiconsIcon } from '@hugeicons/react';
import { BookOpen01Icon, TeacherIcon, ChartHistogramIcon, Mortarboard01Icon } from '@hugeicons/core-free-icons';

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined') return () => { };
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
};

export default function Home() {
  const role = useSyncExternalStore(subscribe, getRole, () => null);
  const isLoggedIn = !!role;

  const features = [
    { icon: <HugeiconsIcon icon={BookOpen01Icon} className="w-10 h-10 text-white" />, title: 'Browse Courses', desc: 'Explore courses from top universities worldwide' },
    { icon: <HugeiconsIcon icon={TeacherIcon} className="w-10 h-10 text-white" />, title: 'Expert Instructors', desc: 'Learn from industry leaders and academics' },
    { icon: <HugeiconsIcon icon={ChartHistogramIcon} className="w-10 h-10 text-white" />, title: 'Track Progress', desc: 'Monitor your learning journey with analytics' },
    { icon: <HugeiconsIcon icon={Mortarboard01Icon} className="w-10 h-10 text-white" />, title: 'Get Certified', desc: 'Earn certificates and diplomas' },
  ];

  const dashboardHref =
    role === 'admin'
      ? '/admin'
      : role === 'instructor'
        ? '/instructor'
        : role === 'student'
          ? '/student'
          : role === 'analyst'
            ? '/analyst'
            : '/';
  const coursesHref =
    role === 'instructor' ? '/instructor/courses' : role === 'student' ? '/student/courses' : '/';

  return (
    <div className="flex flex-col min-h-[calc(80vh-4rem)]">
      {/* Hero Section: Welcome back when logged in, else landing CTA */}
      <section className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
        <div className="space-y-4 max-w-3xl mb-10">
          {isLoggedIn ? (
            <>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Welcome back
              </h1>
              <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                You're signed in as <span className="text-zinc-300 capitalize">{role}</span>.
                Go to your dashboard or explore below.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Master Your Craft with <br />
                <span className="text-zinc-400">World-Class Education</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                Access courses in AI, Machine Learning, Data Science, and more.
                Advance your career with certifications from top institutions.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-4">
          {isLoggedIn ? (
            <>
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href={dashboardHref}>Go to Dashboard</Link>
              </Button>
              {coursesHref !== '/' && (
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                  <Link href={coursesHref}>View Courses</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="/login">View Courses</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-zinc-800 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
