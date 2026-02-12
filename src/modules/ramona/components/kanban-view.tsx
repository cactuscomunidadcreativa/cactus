'use client';

import { useTranslations } from 'next-intl';
import type { RMContent, ContentStatus } from '../types';
import { STATUS_ORDER } from '../lib/utils';
import { KanbanColumn } from './kanban-column';

interface KanbanViewProps {
  contents: RMContent[];
  onEdit: (content: RMContent) => void;
  onStatusChange: (contentId: string, newStatus: ContentStatus) => void;
}

export function KanbanView({ contents, onEdit, onStatusChange }: KanbanViewProps) {
  const t = useTranslations('ramona.kanban');

  const columnData = STATUS_ORDER.map((status) => ({
    status,
    contents: contents.filter((c) => c.status === status),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-xs text-muted-foreground">{t('dragHint')}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columnData.map(({ status, contents: colContents }) => (
          <KanbanColumn
            key={status}
            status={status}
            contents={colContents}
            onEdit={onEdit}
            onDrop={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
