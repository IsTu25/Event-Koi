import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen animated-gradient-bg text-white overflow-hidden">
      {/* Floating Orbs */}
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      {/* Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Now Live — Discover Events Near You</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
            <span className="text-gradient-glow">Event Koi</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the <span className="text-gradient font-medium">future</span> of event management.
            <br />
            <span className="text-gray-400">Streamlined. Powerful. Built for you.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link
              href="/register"
              className="gradient-btn px-10 py-4 rounded-2xl text-lg font-bold text-white shadow-2xl"
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              className="glass-strong px-10 py-4 rounded-2xl text-lg font-semibold text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 w-full max-w-6xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">Why Event Koi?</span>
          </h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            A powerful RDBMS-backed platform with features designed for modern event management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <FeatureCard
              icon="🎫"
              title="Smart Ticketing"
              description="QR-based tickets with real-time validation and capacity tracking"
              gradient="from-pink-500 to-rose-500"
            />
            <FeatureCard
              icon="👥"
              title="Social Connect"
              description="Add friends, chat in real-time, and never miss events together"
              gradient="from-purple-500 to-indigo-500"
            />
            <FeatureCard
              icon="📊"
              title="Deep Analytics"
              description="RDBMS-powered insights with complex queries and reports"
              gradient="from-indigo-500 to-cyan-500"
            />
            <FeatureCard
              icon="🔔"
              title="Smart Notifications"
              description="Event reminders, friend updates, and personalized alerts"
              gradient="from-cyan-500 to-teal-500"
            />
            <FeatureCard
              icon="🏢"
              title="Venue Management"
              description="Complete venue catalog with capacity and availability tracking"
              gradient="from-amber-500 to-orange-500"
            />
            <FeatureCard
              icon="⭐"
              title="Reviews & Ratings"
              description="Build trust with authentic feedback from real attendees"
              gradient="from-rose-500 to-pink-500"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 w-full max-w-5xl mx-auto">
          <div className="glass-strong rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatItem number="50+" label="Database Tables" />
              <StatItem number="100+" label="SQL Procedures" />
              <StatItem number="∞" label="Scalability" />
              <StatItem number="24/7" label="Reliability" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-32 text-center">
          <div className="glass rounded-3xl p-12 max-w-2xl mx-auto border-gradient">
            <h3 className="text-3xl font-bold mb-4">Ready to manage events like a pro?</h3>
            <p className="text-gray-400 mb-8">Join thousands of organizers and attendees on Event Koi</p>
            <Link
              href="/register"
              className="gradient-btn inline-block px-12 py-4 rounded-2xl text-lg font-bold text-white"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 text-center text-sm text-gray-500">
          <p>Built with 💜 for RDBMS Project • © 2024 Event Koi</p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="premium-card p-6 group cursor-pointer">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-gradient mb-2">{number}</div>
      <div className="text-sm text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}
