'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, FileText, CheckCircle2, Clock } from 'lucide-react';

interface ActivityItem {
  type: 'generation' | 'content' | 'task';
  title: string;
  detail: string;
  status: string;
  date: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPE_CONFIG = {
  generation: { icon: Sparkles, color: 'text-cactus-green', bg: 'bg-cactus-green/10' },
  content: { icon: FileText, color: 'text-ramona-purple', bg: 'bg-ramona-purple/10' },
  task: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

export function ActivityFeed() {
  const t = useTranslations('platform.dashboard');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/activity')
      .then((r) => r.json())
      .then((data) => {
        setActivity(data.activity || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-muted rounded mb-1" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activity.map((item, i) => {
        const config = TYPE_CONFIG[item.type];
        const Icon = config.icon;
        return (
          <div
            key={`${item.type}-${i}`}
            className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:border-muted-foreground/20 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t(`activity.${item.type}`)}</span>
                {item.detail && (
                  <>
                    <span>·</span>
                    <span>{item.detail}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo(item.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
