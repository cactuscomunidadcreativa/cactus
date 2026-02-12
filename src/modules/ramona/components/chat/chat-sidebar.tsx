'use client';

import { useTranslations } from 'next-intl';
import type { RMBrand, SocialPlatform, ContentType } from '../../types';
import { PlatformBadge } from '../platform-badge';

interface ChatSidebarProps {
  brand: RMBrand;
  selectedPlatform: SocialPlatform;
  selectedType: ContentType;
  onPlatformChange: (p: SocialPlatform) => void;
  onTypeChange: (t: ContentType) => void;
}

const CONTENT_TYPES: ContentType[] = ['post', 'story', 'reel', 'carousel', 'thread', 'article'];

export function ChatSidebar({
  brand,
  selectedPlatform,
  selectedType,
  onPlatformChange,
  onTypeChange,
}: ChatSidebarProps) {
  const t = useTranslations('ramona.chat');
  const ts = useTranslations('ramona.studio');

  return (
    <div className="space-y-4 p-3 bg-card border border-border rounded-lg">
      <h4 className="text-xs font-medium text-muted-foreground">{t('contextInfo')}</h4>

      {/* Brand info */}
      <div>
        <p className="text-sm font-medium">{brand.name}</p>
        <p className="text-xs text-muted-foreground">{brand.industry}</p>
      </div>

      {/* Platform */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1.5">{t('selectPlatform')}</label>
        <div className="flex flex-wrap gap-1.5">
          {brand.platforms.map((p) => (
            <button
              key={p}
              onClick={() => onPlatformChange(p)}
              className={`transition-opacity ${selectedPlatform === p ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <PlatformBadge platform={p} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Content type */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1.5">{t('selectType')}</label>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct}
              onClick={() => onTypeChange(ct)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                selectedType === ct
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {ts(`types.${ct}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
