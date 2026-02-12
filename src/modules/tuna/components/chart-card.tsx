'use client';

import { useState, useEffect } from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  showValues?: boolean;
  animated?: boolean;
  variant?: 'horizontal' | 'vertical';
}

export function BarChart({
  data,
  title,
  height = 200,
  showValues = true,
  animated = true,
  variant = 'vertical',
}: BarChartProps) {
  const [animatedData, setAnimatedData] = useState(animated ? data.map((d) => ({ ...d, value: 0 })) : data);

  useEffect(() => {
    if (!animated) return;

    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);

    return () => clearTimeout(timer);
  }, [data, animated]);

  const maxValue = Math.max(...data.map((d) => d.value));

  if (variant === 'horizontal') {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="space-y-3">
          {animatedData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                {showValues && (
                  <span className="font-medium">${item.value.toLocaleString('es-PE')}</span>
                )}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || 'hsl(340 82% 43%)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      <div className="flex items-end gap-2" style={{ height }}>
        {animatedData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            {/* Value */}
            {showValues && (
              <span className="text-xs font-medium text-muted-foreground">
                ${(item.value / 1000).toFixed(0)}K
              </span>
            )}
            {/* Bar */}
            <div
              className="w-full rounded-t-lg transition-all duration-1000 ease-out animate-tuna-bar-grow"
              style={{
                height: `${(item.value / maxValue) * (height - 40)}px`,
                backgroundColor: item.color || 'hsl(340 82% 43%)',
                animationDelay: `${idx * 100}ms`,
              }}
            />
            {/* Label */}
            <span className="text-xs text-muted-foreground text-center truncate w-full">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comparison bar chart (Budget vs Actual)
export function ComparisonChart({
  data,
  title,
}: {
  data: { label: string; budget: number; actual: number }[];
  title?: string;
}) {
  const maxValue = Math.max(...data.flatMap((d) => [d.budget, d.actual]));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted-foreground/30" />
          <span className="text-muted-foreground">Presupuesto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-tuna-magenta" />
          <span className="text-muted-foreground">Real</span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {data.map((item, idx) => {
          const variance = ((item.actual - item.budget) / item.budget) * 100;
          const isOver = variance > 0;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className={`text-xs ${isOver ? 'text-destructive' : 'text-tuna-green'}`}>
                  {isOver ? '+' : ''}{variance.toFixed(1)}%
                </span>
              </div>

              {/* Budget bar */}
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/30 rounded-full"
                  style={{ width: `${(item.budget / maxValue) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-tuna-gradient rounded-full transition-all duration-1000"
                  style={{ width: `${(item.actual / maxValue) * 100}%` }}
                />
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ppto: ${item.budget.toLocaleString('es-PE')}</span>
                <span>Real: ${item.actual.toLocaleString('es-PE')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut/Pie chart for distribution
export function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90; // Start from top

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle);
    const end = polarToCartesian(50, 50, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}

      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${(seg.percentage / 100) * 220} 220`}
                strokeDashoffset={-segments.slice(0, idx).reduce((sum, s) => sum + (s.percentage / 100) * 220, 0)}
                className="transition-all duration-1000"
              />
            ))}
          </svg>

          {/* Center */}
          {(centerLabel || centerValue) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerValue && <span className="text-lg font-bold">{centerValue}</span>}
              {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm" title={seg.label}>
              <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="flex-1 text-muted-foreground truncate min-w-0">{seg.label}</span>
              <span className="font-medium flex-shrink-0">{seg.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Trend line chart
export function TrendChart({
  data,
  title,
  height = 150,
}: {
  data: { label: string; value: number }[];
  title?: string;
  height?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, idx) => ({
    x: (idx / (data.length - 1)) * 100,
    y: 100 - ((d.value - minValue) / range) * 80 - 10,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}

      <div style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Area fill */}
          <path d={areaD} fill="url(#tuna-gradient)" opacity="0.2" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="hsl(340 82% 43%)" strokeWidth="2" strokeLinecap="round" />

          {/* Points */}
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="3" fill="hsl(340 82% 43%)" />
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="tuna-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(340 82% 43%)" />
              <stop offset="100%" stopColor="hsl(340 82% 43%)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {data.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
