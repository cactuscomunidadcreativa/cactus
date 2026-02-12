'use client';

import { useTranslations } from 'next-intl';
import { PLATFORMS } from '../../lib/platforms';
import type { BrandOnboardingData, SocialPlatform } from '../../types';

interface StepPlatformsProps {
  data: BrandOnboardingData;
  onTogglePlatform: (platform: SocialPlatform) => void;
  onUpdate: (partial: Partial<BrandOnboardingData>) => void;
}

const PLATFORM_KEYS: SocialPlatform[] = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];

export function StepPlatforms({ data, onTogglePlatform, onUpdate }: StepPlatformsProps) {
  const t = useTranslations('ramona.onboarding.platforms');
  const tPlatforms = useTranslations('ramona.platforms');

  function handleCompetitorsChange(value: string) {
    const competitors = value.split('\n').map((c) => c.trim()).filter(Boolean);
    onUpdate({ competitors });
  }

  function handleExampleContentChange(value: string) {
    const examples = value.split('\n').map((c) => c.trim()).filter(Boolean);
    onUpdate({ example_content: examples });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-3 block">{t('select')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLATFORM_KEYS.map((key) => {
            const platform = PLATFORMS[key];
            const isSelected = data.platforms.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTogglePlatform(key)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-muted/50 text-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-lg">{platform.icon}</span>
                {tPlatforms(key)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('competitors')}</label>
        <textarea
          value={data.competitors.join('\n')}
          onChange={(e) => handleCompetitorsChange(e.target.value)}
          placeholder={t('competitorsPlaceholder')}
          rows={3}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('exampleContent')}</label>
        <textarea
          value={data.example_content.join('\n')}
          onChange={(e) => handleExampleContentChange(e.target.value)}
          placeholder={t('exampleContentPlaceholder')}
          rows={3}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
        />
      </div>
    </div>
  );
}
