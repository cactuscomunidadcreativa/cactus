'use client';

import { useTranslations } from 'next-intl';
import { moodEmoji } from '../lib/utils';
import type { WFMood, WFMember, TeamPulse, EmotionData } from '../types';

interface TeamPulseViewProps {
  pulse: TeamPulse;
  moods: WFMood[];
  members: WFMember[];
}

export function TeamPulseView({ pulse, moods, members }: TeamPulseViewProps) {
  const t = useTranslations('weekflow.pulse');

  function getMember(memberId: string): WFMember | undefined {
    return members.find((m) => m.id === memberId);
  }

  if (pulse.totalCheckins === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl mb-1">{moodEmoji(Math.round(pulse.avgMood))}</p>
          <p className="text-2xl font-bold">{pulse.avgMood}</p>
          <p className="text-xs text-muted-foreground">{t('avgMood')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl mb-1">⚡</p>
          <p className="text-2xl font-bold">{pulse.avgEnergy}</p>
          <p className="text-xs text-muted-foreground">{t('avgEnergy')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl mb-1">👥</p>
          <p className="text-2xl font-bold">{pulse.totalCheckins}</p>
          <p className="text-xs text-muted-foreground">{t('checkins', { count: pulse.totalCheckins })}</p>
        </div>
      </div>

      {/* Individual check-ins */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="space-y-3">
          {moods.map((mood) => {
            const member = getMember(mood.member_id);
            if (!member) return null;
            const emotionData = mood.emotion_data as EmotionData | null;

            return (
              <div key={mood.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <span className="text-xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {emotionData?.label && (
                    <p className="text-xs text-muted-foreground">
                      {emotionData.label}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{moodEmoji(mood.mood)}</span>
                  <span className="text-muted-foreground">⚡{mood.energy}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
