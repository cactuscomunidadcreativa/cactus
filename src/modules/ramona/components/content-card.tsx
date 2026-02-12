'use client';

import { useTranslations } from 'next-intl';
import { Calendar, GripVertical, MoreHorizontal } from 'lucide-react';
import type { RMContent } from '../types';
import { STATUS_COLORS } from '../lib/utils';
import { PlatformBadge } from './platform-badge';
import { truncateText, formatScheduledDate } from '../lib/utils';

interface ContentCardProps {
  content: RMContent;
  onEdit: (content: RMContent) => void;
  onStatusChange?: (id: string, status: RMContent['status']) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, content: RMContent) => void;
}

export function ContentCard({ content, onEdit, draggable, onDragStart }: ContentCardProps) {
  const t = useTranslations('ramona.content');
  const colors = STATUS_COLORS[content.status];

  return (
    <div
      className={`bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${colors.border}`}
      onClick={() => onEdit(content)}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, content)}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
        )}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {content.title && (
            <p className="text-sm font-medium mb-1 truncate">{content.title}</p>
          )}

          {/* Body preview */}
          <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
            {truncateText(content.body, 120)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <PlatformBadge platform={content.platform} size="sm" showLabel={false} />

            {content.scheduled_at && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatScheduledDate(content.scheduled_at)}
              </span>
            )}
          </div>

          {/* Hashtags */}
          {content.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {content.hashtags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-primary/70">#{tag}</span>
              ))}
              {content.hashtags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{content.hashtags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
