'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TONE_OPTIONS } from '../../lib/platforms';
import type { BrandOnboardingData } from '../../types';

interface StepVoiceProps {
  data: BrandOnboardingData;
  onToggleTone: (tone: string) => void;
  onUpdate: (partial: Partial<BrandOnboardingData>) => void;
}

export function StepVoice({ data, onToggleTone, onUpdate }: StepVoiceProps) {
  const t = useTranslations('ramona.onboarding.voice');
  const [keywordsText, setKeywordsText] = useState(data.keywords.join(', '));
  const [forbiddenText, setForbiddenText] = useState(data.forbidden_words.join(', '));

  function handleKeywordsChange(value: string) {
    setKeywordsText(value);
    const keywords = value.split(',').map((k) => k.trim()).filter(Boolean);
    onUpdate({ keywords });
  }

  function handleForbiddenChange(value: string) {
    setForbiddenText(value);
    const forbidden = value.split(',').map((k) => k.trim()).filter(Boolean);
    onUpdate({ forbidden_words: forbidden });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-1 block">{t('toneLabel')}</label>
        <p className="text-xs text-muted-foreground mb-3">{t('toneHint')}</p>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => {
            const isSelected = data.tone.includes(tone);
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onToggleTone(tone)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-foreground border-border hover:border-primary/50'
                }`}
              >
                {t(`tones.${tone}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('keywords')}</label>
        <input
          type="text"
          value={keywordsText}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder={t('keywordsPlaceholder')}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('forbidden')}</label>
        <input
          type="text"
          value={forbiddenText}
          onChange={(e) => handleForbiddenChange(e.target.value)}
          placeholder={t('forbiddenPlaceholder')}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        />
      </div>
    </div>
  );
}
