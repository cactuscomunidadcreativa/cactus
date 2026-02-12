'use client';

import { useTranslations } from 'next-intl';
import type { RMUsage } from '../types';

interface UsageMeterProps {
  usage: RMUsage | null;
  limit: number; // -1 = unlimited
}

export function UsageMeter({ usage, limit }: UsageMeterProps) {
  const t = useTranslations('ramona.usage');
  const used = usage?.content_count || 0;
  const generations = usage?.generation_count || 0;
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isAtLimit = !isUnlimited && used >= limit;

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{t('title')}</span>
        <span className="text-xs text-muted-foreground">
          {t('generations', { count: generations })}
        </span>
      </div>

      {isUnlimited ? (
        <p className="text-xs text-muted-foreground">{t('unlimited')}</p>
      ) : (
        <>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-destructive' : percentage > 80 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isAtLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {isAtLimit ? t('limitReached') : t('used', { used, limit })}
            </span>
            {isAtLimit && (
              <button className="text-xs text-primary hover:underline">
                {t('upgrade')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
