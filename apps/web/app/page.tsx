import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Home() {
  const features = [
    { icon: '📚', title: 'Browse Courses', desc: 'Explore courses from top universities worldwide' },
    { icon: '👨‍🏫', title: 'Expert Instructors', desc: 'Learn from industry leaders and academics' },
    { icon: '📊', title: 'Track Progress', desc: 'Monitor your learning journey with analytics' },
    { icon: '🎓', title: 'Get Certified', desc: 'Earn certificates and diplomas' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(80vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
        <div className="space-y-4 max-w-3xl mb-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Master Your Craft with <br />
            <span className="text-zinc-400">World-Class Education</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Access courses in AI, Machine Learning, Data Science, and more.
            Advance your career with certifications from top institutions.
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
            <Link href="/login">View Courses</Link>
          </Button>
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
