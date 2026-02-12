'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface MoodPoint {
  week: string;
  mood: number;
  energy: number;
}

export function MoodChart() {
  const t = useTranslations('platform.dashboard');
  const [moodTrend, setMoodTrend] = useState<MoodPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => {
        setMoodTrend(data.moodTrend || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="flex gap-3 items-end h-24">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 flex gap-1 items-end">
              <div className="flex-1 bg-muted rounded-t" style={{ height: `${30 + i * 15}%` }} />
              <div className="flex-1 bg-muted rounded-t" style={{ height: `${40 + i * 10}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (moodTrend.length === 0) {
    return null;
  }

  const maxValue = 10;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-end gap-3 h-28">
        {moodTrend.map((point, i) => {
          const moodHeight = (point.mood / maxValue) * 100;
          const energyHeight = (point.energy / maxValue) * 100;
          const weekLabel = new Date(point.week).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end w-full h-20">
                <div
                  className="flex-1 bg-cactus-green/60 rounded-t transition-all"
                  style={{ height: `${moodHeight}%` }}
                  title={`Mood: ${point.mood}`}
                />
                <div
                  className="flex-1 bg-accent/40 rounded-t transition-all"
                  style={{ height: `${energyHeight}%` }}
                  title={`Energy: ${point.energy}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {weekLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-cactus-green/60" />
          <span className="text-[10px] text-muted-foreground">Mood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-accent/40" />
          <span className="text-[10px] text-muted-foreground">Energy</span>
        </div>
      </div>
    </div>
  );
}
