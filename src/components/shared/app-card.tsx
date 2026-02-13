'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
import Image from 'next/image';

// Map app IDs to logo files in /public
const APP_LOGOS: Record<string, string> = {
  ramona: '/ramona.png',
  tuna: '/tuna.png',
  agave: '/agave.png',
  saguaro: '/saguaro.png',
  pita: '/pita.png',
};

interface AppTier {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  sort_order: number;
}

interface AppCardProps {
  app: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    status: string;
    has_free_trial: boolean;
    trial_days: number;
    features: string[];
    base_price_monthly: number;
    base_price_yearly: number;
  };
  tiers: AppTier[];
  subscription?: {
    app_id: string;
    status: string;
    tier_id: string;
  };
}

export function AppCard({ app, tiers, subscription }: AppCardProps) {
  const t = useTranslations('marketplace');
  const tc = useTranslations('common');
  const [yearly, setYearly] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(
    tiers.length > 0 ? tiers[0]?.id : null
  );

  const isSubscribed = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
  const hasMultipleTiers = tiers.length > 1;

  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);

  async function handleSubscribe() {
    const tierId = selectedTier || tiers[0]?.id;
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: app.id,
        tierId,
        yearly,
      }),
    });
    const { url } = await response.json();
    if (url) window.location.href = url;
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-5 pb-4"
        style={{ borderTop: `3px solid ${app.color}` }}
      >
        <div className="flex items-start gap-3 mb-3">
          {APP_LOGOS[app.id] ? (
            <Image
              src={APP_LOGOS[app.id]}
              alt={app.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-contain"
            />
          ) : (
            <span
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: app.color + '15' }}
            >
              {app.icon}
            </span>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-lg">{app.name}</h3>
              {app.status === 'beta' && (
                <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-ramona-purple/10 text-ramona-purple">
                  {tc('beta')}
                </span>
              )}
              {app.status === 'coming-soon' && (
                <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tc('comingSoon')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{app.description}</p>
          </div>
        </div>

        {/* Pricing toggle */}
        {!isSubscribed && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setYearly(false)}
              className={`text-xs px-2 py-1 rounded ${!yearly ? 'bg-cactus-green text-white' : 'text-muted-foreground'}`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`text-xs px-2 py-1 rounded ${yearly ? 'bg-cactus-green text-white' : 'text-muted-foreground'}`}
            >
              {t('pricing.yearly')}
              <span className="ml-1 text-[10px]">
                {t('pricing.savePercent', { percent: '17' })}
              </span>
            </button>
          </div>
        )}

        {/* Tiers */}
        {hasMultipleTiers && !isSubscribed ? (
          <div className="space-y-2 mb-4">
            {sortedTiers.map((tier, i) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selectedTier === tier.id
                    ? 'border-cactus-green bg-cactus-green/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {tier.display_name}
                    {i === 1 && (
                      <span className="ml-2 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                        {t('pricing.mostPopular')}
                      </span>
                    )}
                  </span>
                  <span className="font-display font-bold">
                    {formatPrice(yearly ? tier.price_yearly / 12 : tier.price_monthly)}
                    <span className="text-xs font-normal text-muted-foreground">{tc('perMonth')}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : !isSubscribed && sortedTiers[0] ? (
          <div className="mb-4">
            <span className="text-2xl font-display font-bold">
              {formatPrice(yearly ? sortedTiers[0].price_yearly / 12 : sortedTiers[0].price_monthly)}
            </span>
            <span className="text-sm text-muted-foreground">{tc('perMonth')}</span>
          </div>
        ) : null}

        {/* Features */}
        <div className="space-y-1.5 mb-4">
          {(app.features as string[]).slice(0, 4).map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-3.5 w-3.5 text-cactus-green flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isSubscribed ? (
          <div className="flex items-center gap-2 text-sm text-cactus-green font-medium">
            <Sparkles className="h-4 w-4" />
            {t('appCard.active')}
          </div>
        ) : app.status === 'coming-soon' ? (
          <button
            disabled
            className="w-full py-2.5 border border-border rounded-md text-sm text-muted-foreground"
          >
            {tc('comingSoon')}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            className="w-full py-2.5 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            {app.has_free_trial
              ? t('appCard.startTrial') + ` - ${t('appCard.trialDays', { days: app.trial_days })}`
              : t('appCard.subscribe')}
          </button>
        )}
      </div>
    </div>
  );
}
