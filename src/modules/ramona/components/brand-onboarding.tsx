'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useBrandOnboarding } from '../hooks/use-brand-onboarding';
import { StepBasics } from './brand-onboarding-steps/step-basics';
import { StepVoice } from './brand-onboarding-steps/step-voice';
import { StepAudience } from './brand-onboarding-steps/step-audience';
import { StepPlatforms } from './brand-onboarding-steps/step-platforms';
import { StepReview } from './brand-onboarding-steps/step-review';

interface BrandOnboardingProps {
  userId: string;
  onComplete: (brandId: string) => void;
  onSkip?: () => void;
}

export function BrandOnboarding({ userId, onComplete, onSkip }: BrandOnboardingProps) {
  const t = useTranslations('ramona.onboarding');
  const {
    step, totalSteps, data, saving, error, canProceed,
    updateData, updateAudience, toggleTone, togglePlatform,
    nextStep, prevStep, goToStep, saveBrand,
  } = useBrandOnboarding();

  const stepTitles = [
    t('basics.title'),
    t('voice.title'),
    t('audience.title'),
    t('platforms.title'),
    t('review.title'),
  ];

  async function handleFinish() {
    const brandId = await saveBrand();
    if (brandId) {
      onComplete(brandId);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">🌵</span>
        <h2 className="text-2xl font-display font-bold mb-2">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground">
          {t('step', { current: step + 1, total: totalSteps })}
        </p>
        <h3 className="text-sm font-semibold">{stepTitles[step]}</h3>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        {step === 0 && <StepBasics data={data} onUpdate={updateData} />}
        {step === 1 && <StepVoice data={data} onToggleTone={toggleTone} onUpdate={updateData} />}
        {step === 2 && <StepAudience data={data} onUpdate={updateData} onUpdateAudience={updateAudience} />}
        {step === 3 && <StepPlatforms data={data} onTogglePlatform={togglePlatform} onUpdate={updateData} />}
        {step === 4 && <StepReview data={data} onGoToStep={goToStep} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('skipForNow')}
            </button>
          )}
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('previous')}
          </button>
        </div>

        {step < totalSteps - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving || !canProceed}
            className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t('creating') : t('finish')}
          </button>
        )}
      </div>
    </div>
  );
}
