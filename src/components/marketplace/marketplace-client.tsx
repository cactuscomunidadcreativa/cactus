'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { AppCard } from '@/components/shared/app-card';

interface MarketplaceApp {
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
  category?: string;
  app_tiers?: any[];
}

interface MarketplaceClientProps {
  apps: MarketplaceApp[];
  userSubs: Record<string, { app_id: string; status: string; tier_id: string }>;
}

const CATEGORIES = ['all', 'marketing', 'productivity', 'wellness', 'legal'] as const;

export function MarketplaceClient({ apps, userSubs }: MarketplaceClientProps) {
  const t = useTranslations('marketplace');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        !search ||
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || app.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [apps, search, category]);

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cactus-green/30"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              category === cat
                ? 'bg-cactus-green text-white'
                : 'bg-card border border-border text-muted-foreground hover:border-cactus-green/30'
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            tiers={app.app_tiers || []}
            subscription={userSubs[app.id]}
          />
        ))}
      </div>

      {/* No results */}
      {filteredApps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{t('noResults')}</p>
        </div>
      )}
    </>
  );
}
