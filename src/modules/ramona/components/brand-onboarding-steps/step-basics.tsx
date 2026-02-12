'use client';

import { useTranslations } from 'next-intl';
import { INDUSTRIES } from '../../lib/platforms';
import type { BrandOnboardingData } from '../../types';

interface StepBasicsProps {
  data: BrandOnboardingData;
  onUpdate: (partial: Partial<BrandOnboardingData>) => void;
}

export function StepBasics({ data, onUpdate }: StepBasicsProps) {
  const t = useTranslations('ramona.onboarding.basics');

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">{t('name')}</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder={t('namePlaceholder')}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('industry')}</label>
        <select
          value={data.industry}
          onChange={(e) => onUpdate({ industry: e.target.value })}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        >
          <option value="">{t('industryPlaceholder')}</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {t(`industries.${ind}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
