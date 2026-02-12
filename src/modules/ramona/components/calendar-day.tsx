'use client';

import type { RMContent } from '../types';
import { PlatformBadge } from './platform-badge';
import { truncateText } from '../lib/utils';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  contents: RMContent[];
  onContentClick: (content: RMContent) => void;
}

export function CalendarDay({ date, isCurrentMonth, isToday, contents, onContentClick }: CalendarDayProps) {
  return (
    <div
      className={`min-h-[100px] border border-border p-1 ${
        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full mb-1 ${
          isToday
            ? 'bg-primary text-primary-foreground font-bold'
            : isCurrentMonth
            ? 'text-foreground'
            : 'text-muted-foreground'
        }`}
      >
        {date.getDate()}
      </span>

      <div className="space-y-1">
        {contents.slice(0, 3).map((content) => (
          <button
            key={content.id}
            onClick={() => onContentClick(content)}
            className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate hover:bg-muted transition-colors flex items-center gap-1"
          >
            <PlatformBadge platform={content.platform} size="sm" showLabel={false} />
            <span className="truncate">{truncateText(content.body, 30)}</span>
          </button>
        ))}
        {contents.length > 3 && (
          <span className="text-xs text-muted-foreground px-1.5">+{contents.length - 3}</span>
        )}
      </div>
    </div>
  );
}
