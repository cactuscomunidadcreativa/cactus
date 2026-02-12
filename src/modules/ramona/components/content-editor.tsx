'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Trash2, Save } from 'lucide-react';
import type { RMContent, SocialPlatform, ContentType, ContentStatus } from '../types';
import { PLATFORMS, CONTENT_TYPES } from '../lib/platforms';
import { STATUS_ORDER } from '../lib/utils';
import { PlatformBadge } from './platform-badge';

interface ContentEditorProps {
  content: RMContent;
  platforms: SocialPlatform[];
  onSave: (updated: Partial<RMContent> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function ContentEditor({ content, platforms, onSave, onDelete, onClose }: ContentEditorProps) {
  const t = useTranslations('ramona.content');
  const tStatuses = useTranslations('ramona.kanban.statuses');
  const tTypes = useTranslations('ramona.studio.types');

  const [title, setTitle] = useState(content.title || '');
  const [body, setBody] = useState(content.body);
  const [platform, setPlatform] = useState<SocialPlatform>(content.platform);
  const [contentType, setContentType] = useState<ContentType>(content.content_type);
  const [status, setStatus] = useState<ContentStatus>(content.status);
  const [scheduledAt, setScheduledAt] = useState(content.scheduled_at?.slice(0, 16) || '');
  const [hashtagInput, setHashtagInput] = useState(content.hashtags.join(', '));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const availableTypes = CONTENT_TYPES.filter((ct) =>
    PLATFORMS[platform].supportedTypes.includes(ct.key)
  );

  async function handleSave() {
    setSaving(true);
    try {
      const hashtags = hashtagInput
        .split(',')
        .map((h) => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      await onSave({
        id: content.id,
        title: title || null,
        body,
        platform,
        content_type: contentType,
        status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        hashtags,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(content.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-editor-title"
    >
      <div
        className="bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 id="content-editor-title" className="font-semibold">{t('edit')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('body')}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('bodyPlaceholder')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={6}
            />
          </div>

          {/* Platform & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('moveTo')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{tStatuses(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('schedule')}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('platform')}</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlatform(p);
                    const types = PLATFORMS[p].supportedTypes;
                    if (!types.includes(contentType)) setContentType(types[0]);
                  }}
                  className={`transition-all ${
                    platform === p
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <PlatformBadge platform={p} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('type')}</label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((ct) => (
                <button
                  key={ct.key}
                  onClick={() => setContentType(ct.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    contentType === ct.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{ct.icon}</span>
                  <span>{tTypes(ct.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('hashtags')}</label>
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              placeholder={t('addHashtag')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-destructive text-destructive-foreground'
                : 'text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? t('deleteConfirm') : t('delete')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
