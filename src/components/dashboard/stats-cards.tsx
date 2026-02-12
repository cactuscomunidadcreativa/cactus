'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Sparkles, CheckCircle2, ListTodo } from 'lucide-react';

interface Stats {
  contentGenerated: number;
  aiGenerations: number;
  tasksCompleted: number;
  tasksPending: number;
}

export function StatsCards() {
  const t = useTranslations('platform.dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: t('contentGenerated'),
      value: stats?.contentGenerated ?? 0,
      icon: FileText,
      color: 'text-ramona-purple',
      bg: 'bg-ramona-purple/10',
    },
    {
      label: t('aiGenerations'),
      value: stats?.aiGenerations ?? 0,
      icon: Sparkles,
      color: 'text-cactus-green',
      bg: 'bg-cactus-green/10',
    },
    {
      label: t('tasksCompleted'),
      value: stats?.tasksCompleted ?? 0,
      icon: CheckCircle2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('tasksPending'),
      value: stats?.tasksPending ?? 0,
      icon: ListTodo,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 w-12 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${card.bg}`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold">{card.value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {card.label}
            <span className="ml-1 opacity-60">{t('thisMonth')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
