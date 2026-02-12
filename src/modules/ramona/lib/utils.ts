import type { ContentStatus } from '../types';

export const STATUS_COLORS: Record<ContentStatus, { bg: string; text: string; border: string }> = {
  idea: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  draft: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  review: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  approved: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  scheduled: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  published: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  archived: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
};

export const STATUS_ORDER: ContentStatus[] = ['idea', 'draft', 'review', 'approved', 'scheduled', 'published'];

export function getMonthKey(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

export function formatScheduledDate(isoDate: string, locale: string = 'es'): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
