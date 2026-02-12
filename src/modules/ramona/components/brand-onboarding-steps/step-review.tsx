'use client';

import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import type { BrandOnboardingData } from '../../types';

interface StepReviewProps {
  data: BrandOnboardingData;
  onGoToStep: (step: number) => void;
}

export function StepReview({ data, onGoToStep }: StepReviewProps) {
  const t = useTranslations('ramona.onboarding.review');
  const tBasics = useTranslations('ramona.onboarding.basics');
  const tVoice = useTranslations('ramona.onboarding.voice');
  const tPlatforms = useTranslations('ramona.platforms');

  return (
    <div className="space-y-4">
      {/* Basics */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{t('section.basics')}</h4>
          <button onClick={() => onGoToStep(0)} className="p-1 hover:bg-muted rounded transition-colors">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">{tBasics('name')}:</span> {data.name || '—'}</p>
          <p><span className="text-muted-foreground">{tBasics('industry')}:</span> {data.industry ? tBasics(`industries.${data.industry}`) : '—'}</p>
        </div>
      </div>

      {/* Voice */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{t('section.voice')}</h4>
          <button onClick={() => onGoToStep(1)} className="p-1 hover:bg-muted rounded transition-colors">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">{tVoice('toneLabel')}:</span>{' '}
            {data.tone.length > 0 ? data.tone.map((t) => tVoice(`tones.${t}`)).join(', ') : '—'}
          </p>
          <p><span className="text-muted-foreground">{tVoice('keywords')}:</span> {data.keywords.join(', ') || '—'}</p>
          <p><span className="text-muted-foreground">{tVoice('forbidden')}:</span> {data.forbidden_words.join(', ') || '—'}</p>
        </div>
      </div>

      {/* Audience */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{t('section.audience')}</h4>
          <button onClick={() => onGoToStep(2)} className="p-1 hover:bg-muted rounded transition-colors">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Audiencia:</span> {data.audience.age_range || '—'} / {data.audience.gender || 'all'}</p>
          <p><span className="text-muted-foreground">Propuesta:</span> {data.value_proposition || '—'}</p>
        </div>
      </div>

      {/* Platforms */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{t('section.platforms')}</h4>
          <button onClick={() => onGoToStep(3)} className="p-1 hover:bg-muted rounded transition-colors">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-sm">
          <p>
            {data.platforms.length > 0
              ? data.platforms.map((p) => tPlatforms(p)).join(', ')
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
