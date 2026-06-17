import type { ReactNode } from 'react';

interface PageHeaderProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  /** acciones a la derecha (botones, chips) */
  children?: ReactNode;
}

/** Header consistente para todas las superficies de Cactus. */
export function PageHeader({ emoji, title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {emoji && <span className="text-2xl leading-none">{emoji}</span>}
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
