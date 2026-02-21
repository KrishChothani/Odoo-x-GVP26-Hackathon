import { Button } from '@/components/ui/button';
import { Truck, MapPin, Shield, BarChart3, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">FleetFlow</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                Streamline Your Fleet Operations with{' '}
                <span className="text-primary">FleetFlow</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                Replace inefficient manual logbooks with a centralized, rule-based digital hub.
                Optimize your delivery fleet lifecycle, monitor driver safety, and track financial
                performance—all in one platform.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Button size="lg" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop"
                alt="Fleet of delivery trucks"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 dark:bg-slate-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to manage your fleet
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Comprehensive tools designed for modern logistics operations
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<MapPin className="h-6 w-6" />}
                title="Real-time Tracking"
                description="Monitor your entire fleet in real-time with GPS tracking and route optimization."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Driver Safety"
                description="Track driver behavior, ensure compliance, and improve safety standards across your fleet."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Financial Analytics"
                description="Get detailed insights into costs, revenue, and ROI with comprehensive reporting tools."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Role-Based Access"
                description="Manage permissions for managers and dispatchers with secure authentication."
              />
              <FeatureCard
                icon={<Clock className="h-6 w-6" />}
                title="Automated Scheduling"
                description="Optimize delivery schedules and reduce downtime with intelligent automation."
              />
              <FeatureCard
                icon={<Truck className="h-6 w-6" />}
                title="Vehicle Maintenance"
                description="Track maintenance schedules, service history, and keep your fleet in top condition."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to optimize your fleet?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Join thousands of companies already using FleetFlow
            </p>
            <div className="mt-8 flex gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">FleetFlow</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2026 FleetFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

export default LandingPage;
