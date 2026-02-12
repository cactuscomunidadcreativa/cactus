'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EmotionData } from '../types';

interface PlutchikWheelProps {
  onSelect: (data: EmotionData) => void;
  selected?: EmotionData | null;
}

interface EmotionConfig {
  key: string;
  colors: [string, string, string]; // [low, mid, high] intensity colors
  textColors: [string, string, string]; // contrasting text for each ring
  angle: number;
}

// 8 primary emotions with high-contrast text colors for each ring
const EMOTIONS: EmotionConfig[] = [
  { key: 'joy',          colors: ['#FFF9C4', '#FFEB3B', '#F9A825'], textColors: ['#5D4E00', '#5D4E00', '#3E2800'], angle: 0 },
  { key: 'trust',        colors: ['#C8E6C9', '#66BB6A', '#2E7D32'], textColors: ['#1B4D1E', '#0A3012', '#FFFFFF'], angle: 45 },
  { key: 'fear',         colors: ['#E8F5E9', '#4CAF50', '#1B5E20'], textColors: ['#1B4D1E', '#FFFFFF', '#FFFFFF'], angle: 90 },
  { key: 'surprise',     colors: ['#E3F2FD', '#42A5F5', '#1565C0'], textColors: ['#0D3B66', '#FFFFFF', '#FFFFFF'], angle: 135 },
  { key: 'sadness',      colors: ['#E8EAF6', '#5C6BC0', '#283593'], textColors: ['#1A237E', '#FFFFFF', '#FFFFFF'], angle: 180 },
  { key: 'disgust',      colors: ['#F3E5F5', '#AB47BC', '#6A1B9A'], textColors: ['#4A0072', '#FFFFFF', '#FFFFFF'], angle: 225 },
  { key: 'anger',        colors: ['#FFEBEE', '#EF5350', '#C62828'], textColors: ['#7F0000', '#FFFFFF', '#FFFFFF'], angle: 270 },
  { key: 'anticipation', colors: ['#FFF3E0', '#FF9800', '#E65100'], textColors: ['#693D00', '#FFFFFF', '#FFFFFF'], angle: 315 },
];

// Dyads: combined emotions between adjacent primary emotions
const DYADS: { key: string; between: [string, string]; color: string; textColor: string; angle: number }[] = [
  { key: 'love',         between: ['joy', 'trust'],          color: '#F8BBD0', textColor: '#880E4F', angle: 22.5 },
  { key: 'submission',   between: ['trust', 'fear'],         color: '#A5D6A7', textColor: '#1B5E20', angle: 67.5 },
  { key: 'awe',          between: ['fear', 'surprise'],      color: '#B2DFDB', textColor: '#004D40', angle: 112.5 },
  { key: 'disapproval',  between: ['surprise', 'sadness'],   color: '#B3C1E8', textColor: '#1A237E', angle: 157.5 },
  { key: 'remorse',      between: ['sadness', 'disgust'],    color: '#D1B3E8', textColor: '#4A148C', angle: 202.5 },
  { key: 'contempt',     between: ['disgust', 'anger'],      color: '#E8B3C5', textColor: '#7F0000', angle: 247.5 },
  { key: 'aggressiveness', between: ['anger', 'anticipation'], color: '#FFCCBC', textColor: '#BF360C', angle: 292.5 },
  { key: 'optimism',     between: ['anticipation', 'joy'],   color: '#FFE0B2', textColor: '#E65100', angle: 337.5 },
];

const INTENSITIES = ['low', 'mid', 'high'] as const;
const RING_RADII = [
  { inner: 100, outer: 135 },  // low (outer ring)
  { inner: 65, outer: 100 },   // mid (middle ring)
  { inner: 30, outer: 65 },    // high (inner ring)
];

// Dyad ring (outermost)
const DYAD_RING = { inner: 135, outer: 155 };

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
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

export function PlutchikWheel({ onSelect, selected }: PlutchikWheelProps) {
  const t = useTranslations('weekflow.plutchik');
  const [hoveredPetal, setHoveredPetal] = useState<string | null>(null);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const sliceAngle = 360 / EMOTIONS.length;

  function handleClick(emotion: EmotionConfig, intensityIdx: number) {
    const intensityKey = INTENSITIES[intensityIdx];
    const intensity = intensityIdx === 0 ? 1 : intensityIdx === 1 ? 2 : 3;
    const label = t(`intensities.${emotion.key}.${intensityKey}`);

    onSelect({
      emotion: emotion.key,
      intensityKey,
      intensity,
      label,
      color: emotion.colors[intensityIdx],
    });
  }

  function handleDyadClick(dyad: typeof DYADS[0]) {
    onSelect({
      emotion: dyad.key,
      intensityKey: 'dyad',
      intensity: 2,
      label: t(`dyads.${dyad.key}`),
      color: dyad.color,
    });
  }

  // Get contrasting text color for selected emotion display
  function getDisplayTextColor(color: string): string {
    // Parse hex color and determine luminance
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
          {/* Dyad ring (outermost) */}
          {DYADS.map((dyad) => {
            const startAngle = dyad.angle - sliceAngle / 2;
            const endAngle = dyad.angle + sliceAngle / 2;
            const isHovered = hoveredPetal === `dyad-${dyad.key}`;
            const isSelected = selected?.emotion === dyad.key;

            return (
              <path
                key={`dyad-${dyad.key}`}
                d={describeArc(cx, cy, DYAD_RING.inner, DYAD_RING.outer, startAngle, endAngle)}
                fill={dyad.color}
                stroke="white"
                strokeWidth={isSelected ? 2.5 : 1}
                opacity={isHovered || isSelected ? 1 : 0.7}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPetal(`dyad-${dyad.key}`)}
                onMouseLeave={() => setHoveredPetal(null)}
                onClick={() => handleDyadClick(dyad)}
                style={{
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            );
          })}

          {/* Primary emotion rings */}
          {EMOTIONS.map((emotion) => {
            const startAngle = emotion.angle - sliceAngle / 2;
            const endAngle = emotion.angle + sliceAngle / 2;

            return INTENSITIES.map((intensity, ii) => {
              const ring = RING_RADII[ii];
              const petalId = `${emotion.key}-${intensity}`;
              const isHovered = hoveredPetal === petalId;
              const isSelected =
                selected?.emotion === emotion.key && selected?.intensityKey === intensity;

              return (
                <path
                  key={petalId}
                  d={describeArc(cx, cy, ring.inner, ring.outer, startAngle, endAngle)}
                  fill={emotion.colors[ii]}
                  stroke="white"
                  strokeWidth={isSelected ? 2.5 : 1}
                  opacity={isHovered || isSelected ? 1 : 0.8}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPetal(petalId)}
                  onMouseLeave={() => setHoveredPetal(null)}
                  onClick={() => handleClick(emotion, ii)}
                  style={{
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              );
            });
          })}

          {/* Center circle */}
          <circle cx={cx} cy={cy} r="28" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-medium fill-muted-foreground pointer-events-none select-none"
          >
            {selected ? '✓' : '?'}
          </text>

          {/* Primary emotion labels around the wheel */}
          {EMOTIONS.map((emotion) => {
            const labelPos = polarToCartesian(cx, cy, 148, emotion.angle);
            return (
              <text
                key={`label-${emotion.key}`}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-semibold fill-foreground pointer-events-none select-none"
                style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3, strokeLinejoin: 'round' }}
              >
                {t(`emotions.${emotion.key}`)}
              </text>
            );
          })}

          {/* Intensity labels on each petal */}
          {EMOTIONS.map((emotion) => {
            return INTENSITIES.map((intensity, ii) => {
              const ring = RING_RADII[ii];
              const midRadius = (ring.inner + ring.outer) / 2;
              const pos = polarToCartesian(cx, cy, midRadius, emotion.angle);
              const label = t(`intensities.${emotion.key}.${intensity}`);
              // Truncate long labels
              const displayLabel = label.length > 10 ? label.substring(0, 9) + '…' : label;

              return (
                <text
                  key={`int-${emotion.key}-${intensity}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: ii === 2 ? '5px' : '6px',
                    fontWeight: 600,
                    fill: emotion.textColors[ii],
                    paintOrder: 'stroke',
                    stroke: emotion.colors[ii],
                    strokeWidth: 2,
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
            color: getDisplayTextColor(selected.color + '30') === '#ffffff' ? selected.color : getDisplayTextColor(selected.color),
            borderColor: selected.color + '50',
          }}
        >
          {selected.label}
        </div>
      )}

      {hoveredPetal && !selected && (
        <div className="text-sm font-medium text-foreground h-6">
          {(() => {
            if (hoveredPetal.startsWith('dyad-')) {
              const dyadKey = hoveredPetal.replace('dyad-', '');
              return t(`dyads.${dyadKey}`);
            }
            const [emotion, intensity] = hoveredPetal.split('-');
            return t(`intensities.${emotion}.${intensity}`);
          })()}
        </div>
      )}

      {!hoveredPetal && !selected && (
        <div className="text-sm text-muted-foreground h-6">
          {t('instructions')}
        </div>
      )}
    </div>
  );
}
