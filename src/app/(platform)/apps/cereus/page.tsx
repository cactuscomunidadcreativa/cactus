import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Lock, Sparkles, Ruler, DollarSign, Factory, Shirt, Brain } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CereusPage() {
  const supabase = await createClient();
  const t = await getTranslations('landing.cereus');

  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Check active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, tier_id')
    .eq('user_id', user.id)
    .eq('app_id', 'cereus')
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single();

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Access Required</h2>
        <p className="text-muted-foreground mb-6">
          You need an active CEREUS subscription to access the Atelier dashboard.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90 transition-colors"
        >
          View Plans
        </Link>
      </div>
    );
  }

  const modules = [
    {
      icon: Sparkles,
      title: t('features.emotional.title'),
      description: t('features.emotional.description'),
      href: '/apps/cereus/clients',
      color: 'text-cereus-gold',
      bg: 'bg-cereus-gold/10',
    },
    {
      icon: Ruler,
      title: t('features.measurements.title'),
      description: t('features.measurements.description'),
      href: '/apps/cereus/measurements',
      color: 'text-cereus-bordeaux',
      bg: 'bg-cereus-bordeaux/10',
    },
    {
      icon: DollarSign,
      title: t('features.costing.title'),
      description: t('features.costing.description'),
      href: '/apps/cereus/costing',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Factory,
      title: t('features.production.title'),
      description: t('features.production.description'),
      href: '/apps/cereus/production',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Shirt,
      title: t('features.closet.title'),
      description: t('features.closet.description'),
      href: '/apps/cereus/closet',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Brain,
      title: t('features.advisor.title'),
      description: t('features.advisor.description'),
      href: '/apps/cereus/advisor',
      color: 'text-cereus-gold',
      bg: 'bg-cereus-gold/10',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">CEREUS</h1>
          <p className="text-muted-foreground mt-1">
            {t('hero.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-cereus-gold/10 rounded-full">
          <Sparkles className="w-4 h-4 text-cereus-gold" />
          <span className="text-sm font-medium text-cereus-gold">{t('hero.badge')}</span>
        </div>
      </div>

      {/* Tagline */}
      <div className="border-l-4 border-cereus-gold pl-4 py-2">
        <p className="text-lg italic text-muted-foreground">
          {t('tagline')}
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              href={mod.href}
              className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:border-cereus-gold/30"
            >
              <div className={`w-12 h-12 rounded-lg ${mod.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${mod.color}`} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-cereus-gold transition-colors">
                {mod.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mod.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clients', value: '0' },
          { label: 'Active Orders', value: '0' },
          { label: 'In Production', value: '0' },
          { label: 'Closet Items', value: '0' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border bg-card text-center">
            <p className="text-2xl font-display font-bold text-cereus-gold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
