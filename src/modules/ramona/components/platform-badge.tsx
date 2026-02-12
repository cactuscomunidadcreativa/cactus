'use client';

import { useTranslations } from 'next-intl';
import type { SocialPlatform } from '../types';
import { PLATFORMS } from '../lib/platforms';

interface PlatformBadgeProps {
  platform: SocialPlatform;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function PlatformBadge({ platform, size = 'sm', showLabel = true }: PlatformBadgeProps) {
  const t = useTranslations('ramona.platforms');
  const config = PLATFORMS[platform];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{t(platform)}</span>}
    </span>
  );
}
