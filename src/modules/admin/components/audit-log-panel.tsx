'use client';

import { useTranslations } from 'next-intl';
import type { AuditLogEntry } from '../types';

interface AuditLogPanelProps {
  entries: AuditLogEntry[];
}

export function AuditLogPanel({ entries }: AuditLogPanelProps) {
  const t = useTranslations('admin.audit');

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t('noEntries')}</p>;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  function getActionLabel(action: string): string {
    try {
      return t(`actions.${action}`);
    } catch {
      return action;
    }
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{getActionLabel(entry.action)}</span>
            <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {entry.target_type && (
              <span className="bg-muted px-1.5 py-0.5 rounded">{entry.target_type}</span>
            )}
            {entry.target_id && (
              <span className="font-mono">{entry.target_id.slice(0, 12)}</span>
            )}
          </div>
          {entry.details && Object.keys(entry.details).length > 0 && (
            <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-auto">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
