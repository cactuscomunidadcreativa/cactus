'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'percent' | 'number' | 'kg';
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  trend,
  trendLabel,
  icon,
  variant = 'default',
  size = 'md',
  animated = true,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    // Animate count up
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  // Calculate variance if previous value exists
  const variance = previousValue !== undefined ? ((value - previousValue) / previousValue) * 100 : null;
  const calculatedTrend = variance !== null ? (variance > 0 ? 'up' : variance < 0 ? 'down' : 'neutral') : trend;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'kg':
        return `${val.toLocaleString('es-PE')} kg`;
      default:
        return val.toLocaleString('es-PE', { maximumFractionDigits: 0 });
    }
  };

  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-tuna-green/5 border-tuna-green/20',
    warning: 'bg-yellow-500/5 border-yellow-500/20',
    error: 'bg-destructive/5 border-destructive/20',
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizeStyles = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const trendColors = {
    up: 'text-tuna-green',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const TrendIcon = calculatedTrend === 'up' ? TrendingUp : calculatedTrend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`rounded-xl border ${variantStyles[variant]} ${sizeStyles[size]} transition-all duration-300 hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <span className="text-tuna-magenta">{icon}</span>}
      </div>

      {/* Value */}
      <div className={`font-bold font-display ${valueSizeStyles[size]} text-foreground animate-tuna-count-up`}>
        {formatValue(displayValue)}
      </div>

      {/* Trend */}
      {(calculatedTrend || trendLabel) && (
        <div className="flex items-center gap-2 mt-2">
          {calculatedTrend && (
            <div className={`flex items-center gap-1 ${trendColors[calculatedTrend]}`}>
              <TrendIcon className="w-4 h-4" />
              {variance !== null && <span className="text-sm font-medium">{Math.abs(variance).toFixed(1)}%</span>}
            </div>
          )}
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// Comparison KPI showing budget vs actual
export function KPIComparison({
  title,
  budget,
  actual,
  format = 'currency',
  icon,
}: {
  title: string;
  budget: number;
  actual: number;
  format?: 'currency' | 'percent' | 'number';
  icon?: React.ReactNode;
}) {
  const variance = actual - budget;
  const variancePercent = (variance / budget) * 100;
  const isOverBudget = variance > 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('es-PE');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>

      {/* Values */}
      <div className="flex items-center gap-4">
        {/* Budget */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Presupuesto</p>
          <p className="text-lg font-semibold">{formatValue(budget)}</p>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground" />

        {/* Actual */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Real</p>
          <p className="text-lg font-semibold">{formatValue(actual)}</p>
        </div>
      </div>

      {/* Variance */}
      <div
        className={`mt-4 pt-4 border-t border-border flex items-center justify-between ${
          isOverBudget ? 'text-destructive' : 'text-tuna-green'
        }`}
      >
        <span className="text-sm font-medium">Varianza</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatValue(Math.abs(variance))}</span>
          <span className="text-xs">({variancePercent.toFixed(1)}%)</span>
          {isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

// Progress toward campaign close
export function CampaignProgress({
  opsTotal,
  opsClosed,
  dataUploaded,
  validationComplete,
}: {
  opsTotal: number;
  opsClosed: number;
  dataUploaded: boolean;
  validationComplete: boolean;
}) {
  const progress = [
    { label: 'Datos cargados', done: dataUploaded },
    { label: 'OPs cerradas', done: opsClosed === opsTotal, value: `${opsClosed}/${opsTotal}` },
    { label: 'Validación', done: validationComplete },
  ];

  const completedSteps = progress.filter((p) => p.done).length;
  const progressPercent = (completedSteps / progress.length) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Progreso de Cierre</h3>
        <span className="text-sm font-medium text-tuna-magenta">{progressPercent.toFixed(0)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-tuna-gradient rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {progress.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step.done ? 'bg-tuna-green text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.done ? '✓' : idx + 1}
            </div>
            <span className={`text-sm flex-1 ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
            {step.value && <span className="text-sm text-muted-foreground">{step.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
