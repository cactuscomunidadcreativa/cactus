'use client';

import { useTranslations } from 'next-intl';
import { BarChart3, Users, Zap, Hash } from 'lucide-react';
import type { UsageAnalytics } from '../types';

interface AnalyticsPanelProps {
  analytics: UsageAnalytics | null;
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const t = useTranslations('admin.analytics');

  if (!analytics) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t('noData')}</p>;
  }

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-muted-foreground">{t('thisMonth')}</h3>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">{t('totalUsers')}</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalUsers}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs">{t('totalGenerations')}</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.totalGenerations)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Hash className="w-4 h-4" />
            <span className="text-xs">{t('totalTokens')}</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.totalTokens)}</p>
        </div>
      </div>

      {/* By app */}
      {analytics.byApp.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">{t('byApp')}</h4>
          <div className="space-y-2">
            {analytics.byApp.map((app) => (
              <div key={app.app_id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                <span className="text-sm font-medium capitalize">{app.app_id}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{formatNumber(app.generations)} {t('generations')}</span>
                  <span>{formatNumber(app.tokens)} {t('tokens')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top users */}
      {analytics.topUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">{t('topUsers')}</h4>
          <div className="space-y-2">
            {analytics.topUsers.map((user, i) => (
              <div key={user.user_id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm">{user.email || user.user_id.slice(0, 8)}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{formatNumber(user.generations)} {t('generations')}</span>
                  <span>{formatNumber(user.tokens)} {t('tokens')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
