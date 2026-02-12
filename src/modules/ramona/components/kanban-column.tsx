'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RMContent, ContentStatus } from '../types';
import { STATUS_COLORS } from '../lib/utils';
import { ContentCard } from './content-card';

interface KanbanColumnProps {
  status: ContentStatus;
  contents: RMContent[];
  onEdit: (content: RMContent) => void;
  onDrop: (contentId: string, newStatus: ContentStatus) => void;
}

export function KanbanColumn({ status, contents, onEdit, onDrop }: KanbanColumnProps) {
  const t = useTranslations('ramona.kanban');
  const [dragOver, setDragOver] = useState(false);
  const colors = STATUS_COLORS[status];

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const contentId = e.dataTransfer.getData('text/plain');
    if (contentId) onDrop(contentId, status);
  }

  return (
    <div
      className={`flex flex-col min-w-[240px] w-[240px] rounded-lg transition-colors ${
        dragOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
          <span className="text-sm font-medium">{t(`statuses.${status}`)}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('count', { count: contents.length })}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {contents.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8 italic">
            {t('empty')}
          </div>
        )}
        {contents.map((content) => (
          <ContentCard
            key={content.id}
            content={content}
            onEdit={onEdit}
            draggable
            onDragStart={(e, c) => {
              e.dataTransfer.setData('text/plain', c.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        ))}
      </div>
    </div>
  );
}
