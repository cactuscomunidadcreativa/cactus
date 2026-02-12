'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Copy, Check, Save, RefreshCw } from 'lucide-react';
import type { RMBrand, SocialPlatform, ContentType } from '../types';
import { PLATFORMS, CONTENT_TYPES } from '../lib/platforms';
import { buildSystemPrompt, buildUserPrompt } from '../lib/prompts';
import { useContentGenerator } from '../hooks/use-content-generator';
import { PlatformBadge } from './platform-badge';
import { AIStatus } from './ai-status';

interface ContentStudioProps {
  brand: RMBrand;
  onSave: (content: {
    body: string;
    platform: SocialPlatform;
    contentType: ContentType;
    hashtags: string[];
    generationId?: string;
  }) => Promise<void>;
}

export function ContentStudio({ brand, onSave }: ContentStudioProps) {
  const t = useTranslations('ramona.studio');
  const tTypes = useTranslations('ramona.studio.types');
  const { generate, generating, result, error, reset } = useContentGenerator();

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>(brand.platforms[0] || 'instagram');
  const [contentType, setContentType] = useState<ContentType>('post');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const availableTypes = CONTENT_TYPES.filter((ct) =>
    PLATFORMS[platform].supportedTypes.includes(ct.key)
  );

  async function handleGenerate() {
    if (!topic.trim()) return;
    const systemPrompt = buildSystemPrompt(brand);
    const userPrompt = buildUserPrompt({ topic, platform, contentType });
    await generate({
      topic: userPrompt,
      platform,
      contentType,
      brandId: brand.id,
      systemPrompt,
    });
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const hashtags = (result.content.match(/#\w+/g) || []).map((h) => h.slice(1));
      await onSave({
        body: result.content,
        platform,
        contentType,
        hashtags,
        generationId: result.generationId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const config = PLATFORMS[platform];
  const charCount = result?.content.length || 0;

  return (
    <div className="space-y-6">
      {/* Header with AI status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <AIStatus />
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        {/* Platform selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('platform')}</label>
          <div className="flex flex-wrap gap-2">
            {brand.platforms.map((p) => (
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
                <PlatformBadge platform={p} size="md" />
              </button>
            ))}
          </div>
        </div>

        {/* Content type selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('contentType')}</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((ct) => (
              <button
                key={ct.key}
                onClick={() => setContentType(ct.key)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
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

        {/* Prompt input */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('prompt')}</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('promptPlaceholder')}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            rows={3}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t('generate')}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PlatformBadge platform={platform} size="sm" />
              <span>{t('charCount', { count: charCount })}</span>
              {charCount > config.maxChars && (
                <span className="text-destructive font-medium">
                  {t('charLimit', { limit: config.maxChars })}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {result.provider} / {result.model}
            </span>
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {result.content}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('copied') : t('copy')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? t('saved') : saving ? t('generating') : t('save')}
            </button>
            <button
              onClick={() => { reset(); handleGenerate(); }}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('regenerate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
