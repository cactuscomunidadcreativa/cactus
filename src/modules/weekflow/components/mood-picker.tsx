'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { PlutchikWheel } from './plutchik-wheel';
import { SixSecondsWheel } from './six-seconds-wheel';
import { moodEmoji } from '../lib/utils';
import type { EmotionData, WFMood, WFMember } from '../types';

interface MoodPickerProps {
  currentMember: WFMember | null;
  moods: WFMood[];
  onSave: (mood: number, energy: number, emotionData?: EmotionData) => Promise<boolean>;
}

export function MoodPicker({ currentMember, moods, onSave }: MoodPickerProps) {
  const t = useTranslations('weekflow.mood');
  const tPlutchik = useTranslations('weekflow.plutchik');
  const tSixSeconds = useTranslations('weekflow.sixSeconds');

  const existingMood = moods.find((m) => m.member_id === currentMember?.id);
  const [mood, setMood] = useState(existingMood?.mood || 3);
  const [energy, setEnergy] = useState(existingMood?.energy || 3);
  const [emotion, setEmotion] = useState<EmotionData | null>(
    (existingMood?.emotion_data as EmotionData) || null
  );
  const [feeling, setFeeling] = useState<EmotionData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    // Save whichever was selected last (emotion or feeling)
    const selectedData = emotion || feeling || undefined;
    const success = await onSave(mood, energy, selectedData);
    setSaving(false);

    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
  }

  if (!currentMember) return null;

  return (
    <div className="space-y-6">
      {/* Mood & Energy sliders */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">{t('title')}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t('howFeeling')}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('moodLabel')}</label>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{moodEmoji(mood)}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted-foreground w-16 text-right">
                {t(`levels.${mood}`)}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('energy')}</label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t('low')}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted-foreground">{t('high')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plutchik Wheel - Emotions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-1">{tPlutchik('title')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('wheelPlutchikDesc')}</p>
        <PlutchikWheel
          onSelect={(data) => { setEmotion(data); setFeeling(null); }}
          selected={emotion}
        />
      </div>

      {/* Six Seconds Wheel - Feelings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-1">{tSixSeconds('title')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('wheelSixSecondsDesc')}</p>
        <SixSecondsWheel
          onSelect={(data) => { setFeeling(data); setEmotion(null); }}
          selected={feeling}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
          saved
            ? 'bg-green-500 text-white'
            : saveError
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
        }`}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved ? t('saved') : saveError ? t('saveError') : saving ? t('saving') : t('save')}
      </button>
    </div>
  );
}
