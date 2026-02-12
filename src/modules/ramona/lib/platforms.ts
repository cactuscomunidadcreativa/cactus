import type { SocialPlatform, ContentType } from '../types';

export interface PlatformConfig {
  key: SocialPlatform;
  icon: string;
  color: string;
  maxChars: number;
  supportedTypes: ContentType[];
  hashtagSupport: boolean;
}

export const PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    key: 'instagram',
    icon: '📷',
    color: '#E4405F',
    maxChars: 2200,
    supportedTypes: ['post', 'story', 'reel', 'carousel'],
    hashtagSupport: true,
  },
  facebook: {
    key: 'facebook',
    icon: '📘',
    color: '#1877F2',
    maxChars: 63206,
    supportedTypes: ['post', 'story', 'reel'],
    hashtagSupport: true,
  },
  twitter: {
    key: 'twitter',
    icon: '🐦',
    color: '#1DA1F2',
    maxChars: 280,
    supportedTypes: ['post', 'thread'],
    hashtagSupport: true,
  },
  linkedin: {
    key: 'linkedin',
    icon: '💼',
    color: '#0A66C2',
    maxChars: 3000,
    supportedTypes: ['post', 'article', 'carousel'],
    hashtagSupport: true,
  },
  tiktok: {
    key: 'tiktok',
    icon: '🎵',
    color: '#000000',
    maxChars: 2200,
    supportedTypes: ['post', 'reel'],
    hashtagSupport: true,
  },
  multi: {
    key: 'multi',
    icon: '🌐',
    color: '#6366F1',
    maxChars: 280, // constrained by shortest (twitter)
    supportedTypes: ['post'],
    hashtagSupport: true,
  },
};

export const CONTENT_TYPES: { key: ContentType; icon: string }[] = [
  { key: 'post', icon: '📝' },
  { key: 'story', icon: '📱' },
  { key: 'reel', icon: '🎬' },
  { key: 'carousel', icon: '🖼️' },
  { key: 'thread', icon: '🧵' },
  { key: 'article', icon: '📰' },
];

export const INDUSTRIES = [
  'technology', 'ecommerce', 'food', 'health', 'fitness',
  'education', 'fashion', 'beauty', 'travel', 'finance',
  'real_estate', 'entertainment', 'sports', 'automotive',
  'nonprofit', 'consulting', 'agency', 'saas', 'retail', 'other',
] as const;

export const TONE_OPTIONS = [
  'professional', 'friendly', 'funny', 'inspiring',
  'formal', 'casual', 'educational', 'provocative',
] as const;
