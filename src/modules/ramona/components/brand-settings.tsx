'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Save, CheckCircle2 } from 'lucide-react';
import type { RMBrand, SocialPlatform, RMAudience } from '../types';
import { TONE_OPTIONS, INDUSTRIES, PLATFORMS } from '../lib/platforms';

interface BrandSettingsProps {
  brand: RMBrand;
  onSave: (brandId: string, data: Partial<RMBrand>) => Promise<RMBrand | null>;
  onClose: () => void;
}

export function BrandSettings({ brand, onSave, onClose }: BrandSettingsProps) {
  const t = useTranslations('ramona');

  // Local state for editing
  const [name, setName] = useState(brand.name);
  const [industry, setIndustry] = useState(brand.industry || '');
  const [tone, setTone] = useState<string[]>(brand.tone);
  const [keywordsText, setKeywordsText] = useState(brand.keywords.join(', '));
  const [forbiddenText, setForbiddenText] = useState(brand.forbidden_words.join(', '));
  const [audience, setAudience] = useState<RMAudience>(brand.audience || {});
  const [valueProp, setValueProp] = useState(brand.value_proposition || '');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(brand.platforms);
  const [competitorsText, setCompetitorsText] = useState(brand.competitors.join('\n'));
  const [exampleText, setExampleText] = useState(brand.example_content.join('\n'));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleTone(t: string) {
    setTone((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function togglePlatform(p: SocialPlatform) {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function handleSave() {
    setSaving(true);
    const keywords = keywordsText.split(',').map((k) => k.trim()).filter(Boolean);
    const forbidden = forbiddenText.split(',').map((k) => k.trim()).filter(Boolean);
    const competitors = competitorsText.split('\n').map((c) => c.trim()).filter(Boolean);
    const example_content = exampleText.split('\n').map((e) => e.trim()).filter(Boolean);

    const result = await onSave(brand.id, {
      name,
      industry: industry || null,
      tone,
      keywords,
      forbidden_words: forbidden,
      audience,
      value_proposition: valueProp || null,
      platforms,
      competitors,
      example_content,
    });

    setSaving(false);
    if (result) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm';
  const labelClass = 'text-sm font-medium mb-1 block';

  const allPlatforms: SocialPlatform[] = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-settings-title"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10 rounded-t-2xl">
          <h2 id="brand-settings-title" className="text-lg font-display font-bold">
            {t('brand.settings')}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* === BASICS === */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">
              {t('onboarding.basics.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.basics.name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.basics.namePlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.basics.industry')}</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t('onboarding.basics.industryPlaceholder')}</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{t(`onboarding.basics.industries.${ind}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* === VOICE & TONE === */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">
              {t('onboarding.voice.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.voice.toneLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t_tone) => {
                    const isSelected = tone.includes(t_tone);
                    return (
                      <button
                        key={t_tone}
                        type="button"
                        onClick={() => toggleTone(t_tone)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {t(`onboarding.voice.tones.${t_tone}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.voice.keywords')}</label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder={t('onboarding.voice.keywordsPlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.voice.forbidden')}</label>
                <input
                  type="text"
                  value={forbiddenText}
                  onChange={(e) => setForbiddenText(e.target.value)}
                  placeholder={t('onboarding.voice.forbiddenPlaceholder')}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* === AUDIENCE === */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">
              {t('onboarding.audience.title')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('onboarding.audience.ageRange')}</label>
                  <input
                    type="text"
                    value={audience.age_range || ''}
                    onChange={(e) => setAudience((prev) => ({ ...prev, age_range: e.target.value }))}
                    placeholder={t('onboarding.audience.ageRangePlaceholder')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('onboarding.audience.gender')}</label>
                  <select
                    value={audience.gender || 'all'}
                    onChange={(e) => setAudience((prev) => ({ ...prev, gender: e.target.value }))}
                    className={inputClass}
                  >
                    {['all', 'female', 'male', 'nonbinary'].map((g) => (
                      <option key={g} value={g}>{t(`onboarding.audience.genderOptions.${g}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.audience.interests')}</label>
                <textarea
                  value={audience.interests || ''}
                  onChange={(e) => setAudience((prev) => ({ ...prev, interests: e.target.value }))}
                  placeholder={t('onboarding.audience.interestsPlaceholder')}
                  className={inputClass + ' min-h-[80px] resize-y'}
                  rows={2}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.audience.painPoints')}</label>
                <textarea
                  value={audience.pain_points || ''}
                  onChange={(e) => setAudience((prev) => ({ ...prev, pain_points: e.target.value }))}
                  placeholder={t('onboarding.audience.painPointsPlaceholder')}
                  className={inputClass + ' min-h-[80px] resize-y'}
                  rows={2}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.audience.valueProp')}</label>
                <textarea
                  value={valueProp}
                  onChange={(e) => setValueProp(e.target.value)}
                  placeholder={t('onboarding.audience.valuePropPlaceholder')}
                  className={inputClass + ' min-h-[80px] resize-y'}
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* === PLATFORMS & COMPETITORS === */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">
              {t('onboarding.platforms.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.platforms.select')}</label>
                <div className="flex flex-wrap gap-2">
                  {allPlatforms.map((p) => {
                    const isSelected = platforms.includes(p);
                    const config = PLATFORMS[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        <span>{config.icon}</span>
                        {t(`platforms.${p}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.platforms.competitors')}</label>
                <textarea
                  value={competitorsText}
                  onChange={(e) => setCompetitorsText(e.target.value)}
                  placeholder={t('onboarding.platforms.competitorsPlaceholder')}
                  className={inputClass + ' min-h-[80px] resize-y'}
                  rows={3}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.platforms.exampleContent')}</label>
                <textarea
                  value={exampleText}
                  onChange={(e) => setExampleText(e.target.value)}
                  placeholder={t('onboarding.platforms.exampleContentPlaceholder')}
                  className={inputClass + ' min-h-[80px] resize-y'}
                  rows={3}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-background rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('content.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" />{t('content.saveChanges')}</>
            ) : saving ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />{t('onboarding.creating')}</>
            ) : (
              <><Save className="w-4 h-4" />{t('content.saveChanges')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
