'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, BellOff, Globe } from 'lucide-react';

interface AppSettingsModalProps {
  appId: 'ramona' | 'tuna' | 'agave' | 'saguaro';
  onClose: () => void;
  children?: React.ReactNode;
}

export function AppSettingsModal({ appId, onClose, children }: AppSettingsModalProps) {
  const [theme, setTheme] = useState<string>('system');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('es');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  // Update theme
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const appNames: Record<string, string> = {
    ramona: 'RAMONA',
    tuna: 'TUNA',
    agave: 'AGAVE',
    saguaro: 'SAGUARO',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Configuración de {appNames[appId]}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* General Settings */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              General
            </h3>

            {/* Theme */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Tema</p>
                  <p className="text-xs text-muted-foreground">
                    Apariencia de la interfaz
                  </p>
                </div>
              </div>
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg bg-background"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {notifications ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Notificaciones</p>
                  <p className="text-xs text-muted-foreground">
                    Alertas y recordatorios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Idioma</p>
                  <p className="text-xs text-muted-foreground">
                    Idioma de la interfaz
                  </p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg bg-background"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* App-specific settings */}
          {children && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Configuración de {appNames[appId]}
              </h3>
              {children}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
