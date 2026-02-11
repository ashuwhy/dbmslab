'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getRole } from '@/lib/auth';

import { HugeiconsIcon } from '@hugeicons/react';
import { BookOpen01Icon, ChartHistogramIcon, Mortarboard01Icon } from '@hugeicons/core-free-icons';
import Dither from '@/components/Dither';


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
    {
      icon: <HugeiconsIcon icon={BookOpen01Icon} className="h-5 w-5 text-zinc-200" />,
      title: 'Curated Programs',
      desc: 'Learn core AI, ML, and data topics with focused, practical tracks.',
    },
    {
      icon: <HugeiconsIcon icon={ChartHistogramIcon} className="h-5 w-5 text-zinc-200" />,
      title: 'Clear Progress',
      desc: 'Stay consistent with simple milestones and measurable outcomes.',
    },
    {
      icon: <HugeiconsIcon icon={Mortarboard01Icon} className="h-5 w-5 text-zinc-200" />,
      title: 'Recognized Credentials',
      desc: 'Complete projects and earn certificates that support your career growth.',
    },
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
    <div className="relative min-h-screen min-h-dvh overflow-x-hidden bg-black text-white ">
      <div className="pointer-events-none absolute inset-0 z-0">
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
        {/* <div className="absolute inset-0 bg-black/35" /> */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),rgba(0,0,0,0)_45%)]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pb-12 pt-20 md:pt-28">
        <section className="mx-auto w-full max-w-4xl text-center">
          <p className="mx-auto mb-6 inline-flex items-center border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
            Index Corruption Institute
          </p>

          {isLoggedIn ? (
            <>
              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                Welcome back.
                <br />
                <span className="text-zinc-300 capitalize">{role}</span> dashboard is ready.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 md:text-lg">
                Continue learning, manage your work, and keep momentum with a focused workspace.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                Learn with clarity.
                <br />
                Build real skills faster.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 md:text-lg">
                Structured courses in AI, machine learning, and data science designed for consistent progress.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn ? (
              <>
                <Button asChild size="lg" className="h-11 rounded-none bg-white px-6 text-sm font-medium text-black hover:bg-zinc-200">
                  <Link href={dashboardHref}>Go to Dashboard</Link>
                </Button>
                {coursesHref !== '/' && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-none border-white/20 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/10"
                  >
                    <Link href={coursesHref}>View Courses</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild size="lg" className="h-11 rounded-none bg-white px-6 text-sm font-medium text-black hover:bg-zinc-200">
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-none border-white/20 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/10"
                >
                  <Link href="/login">View Courses</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="border border-white/12 bg-black/25 p-5 backdrop-blur-sm transition-colors duration-200 hover:border-white/25"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-white/15 bg-white/5">
                {feature.icon}
              </div>
              <h2 className="text-base font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.desc}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
