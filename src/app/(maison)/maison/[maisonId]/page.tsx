import Link from 'next/link';
import { loadMaisonPublic } from '@/modules/cereus/lib/maison-auth';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Users, DollarSign, Factory, Shirt, Sparkles, Palette,
  ArrowRight, CheckCircle2,
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}): Promise<Metadata> {
  const { maisonId } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) return { title: 'Not Found' };

  const title = maison.config.branding?.meta_title || maison.maisonName;
  return {
    title: `${title} - Haute Couture Atelier`,
    description: maison.config.maison_tagline || `${maison.maisonName} - Powered by CEREUS`,
  };
}

const FEATURES = [
  { icon: Users, title: 'Client Profiles', description: 'Emotional profiles, body measurements, and style DNA for every client.' },
  { icon: DollarSign, title: 'Precision Costing', description: 'BOM engine with material costs, labor, and margin optimization.' },
  { icon: Factory, title: 'Production Tracking', description: 'Workshop management, order pipeline, and quality control.' },
  { icon: Shirt, title: 'Digital Closet', description: 'Every client\'s wardrobe — delivered pieces, favorites, and outfit planning.' },
  { icon: Sparkles, title: 'AI Advisor', description: 'Intelligent style recommendations and campaign generation.' },
  { icon: Palette, title: 'Designer Studio', description: 'Variant configurator, collection builder, and public lookbooks.' },
];

const PLANS = [
  { name: 'Atelier', price: 'Free', period: '', features: ['5 clients', '1 collection', 'Basic costing'] },
  { name: 'Maison', price: '$49', period: '/mo', features: ['Unlimited clients', 'Unlimited collections', 'AI Advisor', 'Production tracking', 'Digital closet'] },
  { name: 'Couture', price: '$149', period: '/mo', features: ['Everything in Maison', 'Custom domain', 'White-label branding', 'Priority support', 'API access'] },
];

export default async function MaisonLandingPage({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) notFound();

  const { maisonName, config } = maison;
  const tagline = config.maison_tagline || 'Haute Couture Intelligence';
  const primaryColor = config.branding?.primary_color || '#0A0A0A';
  const accentColor = config.branding?.accent_color || '#B8943A';

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        :root {
          --maison-primary: ${primaryColor};
          --maison-accent: ${accentColor};
        }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {config.branding?.logo_url ? (
            <img src={config.branding.logo_url} alt={maisonName} className="h-8" />
          ) : (
            <span className="text-2xl font-display font-bold" style={{ color: primaryColor }}>
              {maisonName}
            </span>
          )}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div
          className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-6"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          Powered by CEREUS
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6" style={{ color: primaryColor }}>
          {maisonName}
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          {tagline}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Start Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold text-center mb-4" style={{ color: primaryColor }}>
            Everything your atelier needs
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            From client intake to delivery, manage every aspect of your haute couture operation.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <h3 className="font-display font-semibold mb-2" style={{ color: primaryColor }}>{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold text-center mb-12" style={{ color: primaryColor }}>
            Simple pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border ${i === 1 ? 'border-2 relative' : 'border-gray-200'}`}
                style={i === 1 ? { borderColor: accentColor } : {}}
              >
                {i === 1 && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Popular
                  </div>
                )}
                <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    i === 1
                      ? 'text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={i === 1 ? { backgroundColor: accentColor } : {}}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} {maisonName}. Powered by CEREUS.
        </div>
      </footer>
    </div>
  );
}
