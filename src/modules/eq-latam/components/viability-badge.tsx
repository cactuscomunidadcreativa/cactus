'use client';

import type { ViabilityLevel } from '../types';
import { getViabilityColor, getViabilityLabel } from '../lib/eq-pricing-engine';

interface ViabilityBadgeProps {
  level: ViabilityLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function ViabilityBadge({ level, size = 'md' }: ViabilityBadgeProps) {
  const color = getViabilityColor(level);
  const label = getViabilityLabel(level);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
