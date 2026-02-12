'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EmotionData } from '../types';

interface SixSecondsWheelProps {
  onSelect: (data: EmotionData) => void;
  selected?: EmotionData | null;
}

interface FeelingGroup {
  key: string;
  color: string;
  lightColor: string;
  textColor: string;
  lightTextColor: string;
  feelings: string[];
  angle: number; // center angle for the group
}

// Six Seconds model: 8 feeling families with specific feelings inside each
const FEELING_GROUPS: FeelingGroup[] = [
  {
    key: 'joyful',
    color: '#FFD54F',
    lightColor: '#FFF8E1',
    textColor: '#5D4E00',
    lightTextColor: '#5D4E00',
    feelings: ['happy', 'excited', 'grateful', 'playful', 'content', 'proud'],
    angle: 0,
  },
  {
    key: 'powerful',
    color: '#FF8A65',
    lightColor: '#FBE9E7',
    textColor: '#FFFFFF',
    lightTextColor: '#BF360C',
    feelings: ['confident', 'courageous', 'creative', 'hopeful', 'respected', 'valued'],
    angle: 45,
  },
  {
    key: 'peaceful',
    color: '#66BB6A',
    lightColor: '#E8F5E9',
    textColor: '#FFFFFF',
    lightTextColor: '#1B5E20',
    feelings: ['calm', 'relaxed', 'loving', 'thankful', 'trusting', 'comfortable'],
    angle: 90,
  },
  {
    key: 'sad',
    color: '#42A5F5',
    lightColor: '#E3F2FD',
    textColor: '#FFFFFF',
    lightTextColor: '#0D47A1',
    feelings: ['lonely', 'hurt', 'guilty', 'depressed', 'ashamed', 'disappointed'],
    angle: 135,
  },
  {
    key: 'scared',
    color: '#7E57C2',
    lightColor: '#EDE7F6',
    textColor: '#FFFFFF',
    lightTextColor: '#311B92',
    feelings: ['anxious', 'insecure', 'helpless', 'overwhelmed', 'worried', 'frightened'],
    angle: 180,
  },
  {
    key: 'angry',
    color: '#EF5350',
    lightColor: '#FFEBEE',
    textColor: '#FFFFFF',
    lightTextColor: '#7F0000',
    feelings: ['frustrated', 'critical', 'resentful', 'furious', 'jealous', 'hostile'],
    angle: 225,
  },
  {
    key: 'disgusted',
    color: '#8D6E63',
    lightColor: '#EFEBE9',
    textColor: '#FFFFFF',
    lightTextColor: '#3E2723',
    feelings: ['disapproving', 'judgmental', 'embarrassed', 'repelled', 'hesitant', 'revolted'],
    angle: 270,
  },
  {
    key: 'surprised',
    color: '#26C6DA',
    lightColor: '#E0F7FA',
    textColor: '#004D40',
    lightTextColor: '#004D40',
    feelings: ['amazed', 'confused', 'stunned', 'shocked', 'startled', 'perplexed'],
    angle: 315,
  },
];

// Inner ring: emotion groups, Outer ring: individual feelings
const INNER_RING = { inner: 50, outer: 100 };
const OUTER_RING = { inner: 102, outer: 160 };

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export function SixSecondsWheel({ onSelect, selected }: SixSecondsWheelProps) {
  const t = useTranslations('weekflow.sixSeconds');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const groupAngle = 360 / FEELING_GROUPS.length; // 45° per group
  const feelingAngle = groupAngle / 6; // 7.5° per feeling (6 feelings per group)

  function handleFeelingClick(group: FeelingGroup, feeling: string) {
    onSelect({
      emotion: feeling,
      intensityKey: group.key,
      intensity: 2,
      label: t(`feelings.${group.key}.${feeling}`),
      color: group.color,
    });
  }

  function handleGroupClick(group: FeelingGroup) {
    // Clicking a group selects it as a general emotion
    onSelect({
      emotion: group.key,
      intensityKey: group.key,
      intensity: 1,
      label: t(`groups.${group.key}`),
      color: group.color,
    });
  }

  function getDisplayTextColor(color: string): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">{t('instructions')}</p>

      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer ring: individual feelings (6 per group = 48 total) */}
          {FEELING_GROUPS.map((group) => {
            const groupStart = group.angle - groupAngle / 2;

            return group.feelings.map((feeling, fi) => {
              const startAngle = groupStart + fi * feelingAngle;
              const endAngle = startAngle + feelingAngle;
              const isHovered = hoveredItem === `feeling-${group.key}-${feeling}`;
              const isSelected = selected?.emotion === feeling && selected?.intensityKey === group.key;
              // Alternate between lighter and normal for visual distinction
              const fillColor = fi % 2 === 0 ? group.lightColor : group.color + '40';

              return (
                <path
                  key={`feeling-${group.key}-${feeling}`}
                  d={describeArc(cx, cy, OUTER_RING.inner, OUTER_RING.outer, startAngle, endAngle)}
                  fill={isSelected ? group.color : fillColor}
                  stroke="white"
                  strokeWidth={isSelected ? 2 : 0.8}
                  opacity={isHovered || isSelected ? 1 : 0.85}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredItem(`feeling-${group.key}-${feeling}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleFeelingClick(group, feeling)}
                  style={{
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              );
            });
          })}

          {/* Inner ring: emotion group sectors */}
          {FEELING_GROUPS.map((group) => {
            const startAngle = group.angle - groupAngle / 2;
            const endAngle = group.angle + groupAngle / 2;
            const isHovered = hoveredItem === `group-${group.key}`;
            const isGroupSelected = selected?.intensityKey === group.key;

            return (
              <path
                key={`group-${group.key}`}
                d={describeArc(cx, cy, INNER_RING.inner, INNER_RING.outer, startAngle, endAngle)}
                fill={group.color}
                stroke="white"
                strokeWidth={isGroupSelected ? 2.5 : 1.2}
                opacity={isHovered || isGroupSelected ? 1 : 0.9}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredItem(`group-${group.key}`)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleGroupClick(group)}
                style={{
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            );
          })}

          {/* Center circle */}
          <circle
            cx={cx}
            cy={cy}
            r="48"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-medium fill-muted-foreground pointer-events-none select-none"
          >
            {selected ? '✓' : '?'}
          </text>

          {/* Inner ring labels: group names */}
          {FEELING_GROUPS.map((group) => {
            const midRadius = (INNER_RING.inner + INNER_RING.outer) / 2;
            const pos = polarToCartesian(cx, cy, midRadius, group.angle);

            return (
              <text
                key={`label-group-${group.key}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                style={{
                  fontSize: '7.5px',
                  fontWeight: 700,
                  fill: group.textColor,
                  paintOrder: 'stroke',
                  stroke: group.color,
                  strokeWidth: 2,
                  strokeLinejoin: 'round',
                }}
              >
                {t(`groups.${group.key}`)}
              </text>
            );
          })}

          {/* Outer ring labels: feeling names (horizontal, no rotation) */}
          {FEELING_GROUPS.map((group) => {
            const groupStart = group.angle - groupAngle / 2;

            return group.feelings.map((feeling, fi) => {
              const midAngle = groupStart + fi * feelingAngle + feelingAngle / 2;
              const midRadius = (OUTER_RING.inner + OUTER_RING.outer) / 2;
              const pos = polarToCartesian(cx, cy, midRadius, midAngle);
              const label = t(`feelings.${group.key}.${feeling}`);
              const displayLabel = label.length > 9 ? label.substring(0, 8) + '…' : label;

              return (
                <text
                  key={`label-feeling-${group.key}-${feeling}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: '5px',
                    fontWeight: 600,
                    fill: group.lightTextColor,
                    paintOrder: 'stroke',
                    stroke: fi % 2 === 0 ? group.lightColor : group.color + '40',
                    strokeWidth: 2.5,
                    strokeLinejoin: 'round',
                  }}
                >
                  {displayLabel}
                </text>
              );
            });
          })}
        </svg>
      </div>

      {/* Selection display */}
      {selected && (
        <div
          className="px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm border"
          style={{
            backgroundColor: selected.color + '30',
            color: getDisplayTextColor(selected.color + '30') === '#ffffff'
              ? selected.color
              : getDisplayTextColor(selected.color),
            borderColor: selected.color + '50',
          }}
        >
          {selected.label}
        </div>
      )}

      {hoveredItem && !selected && (
        <div className="text-sm font-medium text-foreground h-6">
          {(() => {
            if (hoveredItem.startsWith('group-')) {
              const groupKey = hoveredItem.replace('group-', '');
              return t(`groups.${groupKey}`);
            }
            if (hoveredItem.startsWith('feeling-')) {
              const parts = hoveredItem.replace('feeling-', '').split('-');
              const groupKey = parts[0];
              const feelingKey = parts.slice(1).join('-');
              return t(`feelings.${groupKey}.${feelingKey}`);
            }
            return '';
          })()}
        </div>
      )}

      {!hoveredItem && !selected && (
        <div className="text-sm text-muted-foreground h-6">
          {t('instructions')}
        </div>
      )}
    </div>
  );
}
