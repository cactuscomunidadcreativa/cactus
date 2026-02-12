'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, ZapOff } from 'lucide-react';

interface AIStatusInfo {
  available: boolean;
  providers: { id: string; name: string; configured: boolean }[];
  defaultProvider: string;
}

export function AIStatus() {
  const t = useTranslations('ramona.ai');
  const [status, setStatus] = useState<AIStatusInfo | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStatus(data); })
      .catch(() => {});
  }, []);

  if (!status) return null;

  const activeProvider = status.providers.find((p) => p.configured);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
      status.available
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }`}>
      {status.available ? (
        <>
          <Zap className="w-3.5 h-3.5" />
          <span>{t('usingProvider', { provider: activeProvider?.name || status.defaultProvider })}</span>
        </>
      ) : (
        <>
          <ZapOff className="w-3.5 h-3.5" />
          <span>{t('notConfigured')}</span>
        </>
      )}
    </div>
  );
}
