import Link from 'next/link';

export default function Home() {
  const features = [
    { icon: '📚', title: 'Browse Courses', desc: 'Explore courses from top universities worldwide' },
    { icon: '👨‍🏫', title: 'Expert Instructors', desc: 'Learn from industry leaders and academics' },
    { icon: '📊', title: 'Track Progress', desc: 'Monitor your learning journey with analytics' },
    { icon: '🎓', title: 'Get Certified', desc: 'Earn certificates and diplomas' },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-400 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Massively Open Online Courses
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl">
          Learn from the World&apos;s Best Universities
        </h1>

        <p className="text-lg text-zinc-400 max-w-xl mb-10">
          Access courses in AI, Machine Learning, Data Science, and more.
          Join thousands of learners advancing their careers.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-transparent text-white text-sm font-semibold rounded-lg border border-zinc-700 hover:bg-zinc-900 transition-colors"
          >
            View Courses
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 border-t border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-12 border-t border-zinc-800">
        <p className="text-center text-sm text-zinc-500 mb-8">Partnered with leading institutions</p>
        <div className="flex items-center justify-center gap-12 text-zinc-600">
          <span className="text-lg font-bold">IITKGP</span>
          <span className="text-lg font-bold">Stanford</span>
          <span className="text-lg font-bold">MIT</span>
          <span className="text-lg font-bold">Oxford</span>
          <span className="text-lg font-bold">IIT Bombay</span>
        </div>
      </section>
    </div>
  );
}
