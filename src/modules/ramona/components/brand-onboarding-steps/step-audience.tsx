'use client';

import { useTranslations } from 'next-intl';
import type { BrandOnboardingData, RMAudience } from '../../types';

interface StepAudienceProps {
  data: BrandOnboardingData;
  onUpdate: (partial: Partial<BrandOnboardingData>) => void;
  onUpdateAudience: (partial: Partial<RMAudience>) => void;
}

export function StepAudience({ data, onUpdate, onUpdateAudience }: StepAudienceProps) {
  const t = useTranslations('ramona.onboarding.audience');

  const genderOptions = ['all', 'female', 'male', 'nonbinary'] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">{t('ageRange')}</label>
          <input
            type="text"
            value={data.audience.age_range || ''}
            onChange={(e) => onUpdateAudience({ age_range: e.target.value })}
            placeholder={t('ageRangePlaceholder')}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('gender')}</label>
          <select
            value={data.audience.gender || 'all'}
            onChange={(e) => onUpdateAudience({ gender: e.target.value })}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          >
            {genderOptions.map((g) => (
              <option key={g} value={g}>
                {t(`genderOptions.${g}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('interests')}</label>
        <textarea
          value={data.audience.interests || ''}
          onChange={(e) => onUpdateAudience({ interests: e.target.value })}
          placeholder={t('interestsPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('painPoints')}</label>
        <textarea
          value={data.audience.pain_points || ''}
          onChange={(e) => onUpdateAudience({ pain_points: e.target.value })}
          placeholder={t('painPointsPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('valueProp')}</label>
        <textarea
          value={data.value_proposition}
          onChange={(e) => onUpdate({ value_proposition: e.target.value })}
          placeholder={t('valuePropPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
        />
      </div>
    </div>
  );
}
