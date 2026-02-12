/**
 * Get the Monday of the current week as ISO date string (YYYY-MM-DD)
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Generate a 6-character uppercase alphanumeric team code
 */
export function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Random avatar emoji
 */
const AVATARS = ['🌵', '🎨', '🚀', '⭐', '🌈', '🔥', '💎', '🌸', '🎯', '🌊'];

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

/**
 * Format week label
 */
export function formatWeekLabel(weekStart: string, locale: string = 'es'): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString(locale, opts);
  const endStr = end.toLocaleDateString(locale, opts);

  return `${startStr} - ${endStr}`;
}

/**
 * Mood emoji by value
 */
export function moodEmoji(mood: number): string {
  const emojis: Record<number, string> = {
    1: '😫',
    2: '😕',
    3: '😐',
    4: '😊',
    5: '😄',
  };
  return emojis[mood] || '😐';
}

/**
 * Priority color classes
 */
export function priorityClasses(priority: string): string {
  switch (priority) {
    case 'urgent': return 'border-l-red-500 bg-red-500/5';
    case 'important': return 'border-l-amber-500 bg-amber-500/5';
    default: return 'border-l-transparent';
  }
}
