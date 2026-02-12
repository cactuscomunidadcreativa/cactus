'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BrandOnboardingData, SocialPlatform, RMAudience } from '../types';

const INITIAL_DATA: BrandOnboardingData = {
  name: '',
  industry: '',
  tone: [],
  keywords: [],
  forbidden_words: [],
  audience: {},
  value_proposition: '',
  competitors: [],
  platforms: [],
  example_content: [],
  visual_style: {},
};

export function useBrandOnboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BrandOnboardingData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  function updateData(partial: Partial<BrandOnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function updateAudience(partial: Partial<RMAudience>) {
    setData((prev) => ({
      ...prev,
      audience: { ...prev.audience, ...partial },
    }));
  }

  function toggleTone(tone: string) {
    setData((prev) => ({
      ...prev,
      tone: prev.tone.includes(tone)
        ? prev.tone.filter((t) => t !== tone)
        : [...prev.tone, tone],
    }));
  }

  function togglePlatform(platform: SocialPlatform) {
    setData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  function nextStep() {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 0) setStep((s) => s - 1);
  }

  function goToStep(s: number) {
    if (s >= 0 && s < totalSteps) setStep(s);
  }

  async function saveBrand(): Promise<string | null> {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not configured');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: brand, error: insertError } = await supabase
        .from('rm_brands')
        .insert({
          user_id: user.id,
          name: data.name,
          industry: data.industry || null,
          tone: data.tone,
          audience: data.audience,
          competitors: data.competitors,
          value_proposition: data.value_proposition || null,
          example_content: data.example_content,
          keywords: data.keywords,
          forbidden_words: data.forbidden_words,
          visual_style: data.visual_style,
          platforms: data.platforms,
          onboarding_completed: true,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      setSaving(false);
      return brand?.id || null;
    } catch (err: any) {
      setError(err.message || 'Error creating brand');
      setSaving(false);
      return null;
    }
  }

  const canProceed = step === 0 ? data.name.trim().length > 0 : true;

  return {
    step,
    totalSteps,
    data,
    saving,
    error,
    canProceed,
    updateData,
    updateAudience,
    toggleTone,
    togglePlatform,
    nextStep,
    prevStep,
    goToStep,
    saveBrand,
  };
}
