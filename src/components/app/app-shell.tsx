'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home, Settings, History, HelpCircle } from 'lucide-react';

export interface AppConfig {
  id: 'ramona' | 'tuna' | 'agave' | 'saguaro';
  name: string;
  emoji: string;
  color: string;
  description?: string;
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  ramona: {
    id: 'ramona',
    name: 'RAMONA',
    emoji: '🎨',
    color: '#9A4E9A',
    description: 'Contenido creativo con IA',
  },
  tuna: {
    id: 'tuna',
    name: 'TUNA',
    emoji: '🐟',
    color: '#0891B2',
    description: 'Análisis financiero inteligente',
  },
  agave: {
    id: 'agave',
    name: 'AGAVE',
    emoji: '🌵',
    color: '#16A34A',
    description: 'Asistente de pricing',
  },
  saguaro: {
    id: 'saguaro',
    name: 'SAGUARO',
    emoji: '🌿',
    color: '#059669',
    description: 'Bienestar y productividad',
  },
};

interface AppShellProps {
  appId: 'ramona' | 'tuna' | 'agave' | 'saguaro';
  children: React.ReactNode;
  showBackButton?: boolean;
  showSettings?: boolean;
  showHistory?: boolean;
  onSettingsClick?: () => void;
  onHistoryClick?: () => void;
}

export function AppShell({
  appId,
  children,
  showBackButton = true,
  showSettings = false,
  showHistory = false,
  onSettingsClick,
  onHistoryClick,
}: AppShellProps) {
  const pathname = usePathname();
  const config = APP_CONFIGS[appId];

  if (!config) {
    return <>{children}</>;
  }

  const isDemo = pathname?.includes('/demo');

  return (
    <div className="min-h-screen bg-background">
      {/* App header bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-sm"
        style={{ backgroundColor: `${config.color}08` }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Back + App info */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Link
                  href="/dashboard"
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Volver al dashboard"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h1
                    className="text-lg font-display font-bold"
                    style={{ color: config.color }}
                  >
                    {config.name}
                  </h1>
                  {config.description && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {config.description}
                    </p>
                  )}
                </div>
              </div>
              {isDemo && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Demo
                </span>
              )}
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-1">
              {showHistory && (
                <button
                  onClick={onHistoryClick}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Historial"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              {showSettings && (
                <button
                  onClick={onSettingsClick}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Configuración"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <Link
                href={`/landing/${appId}`}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                title="Más información"
              >
                <HelpCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* Demo CTA (only in demo mode) */}
      {isDemo && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t py-3 px-4 backdrop-blur-sm"
          style={{ backgroundColor: `${config.color}10` }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Estás usando la versión demo.{' '}
              </span>
              Regístrate para acceder a todas las funciones.
            </p>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: config.color }}
            >
              Comenzar Gratis
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
