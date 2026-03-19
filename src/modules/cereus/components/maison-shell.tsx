'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaisonProvider, useMaison } from '@/modules/cereus/context/maison-context';
import type { MaisonConfig } from '@/modules/cereus/types';
import {
  Users, DollarSign, Factory, Shirt, Sparkles, Palette, BookOpen,
  Menu, X, LogOut,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/costing', label: 'Costing', icon: DollarSign },
  { path: '/production', label: 'Production', icon: Factory },
  { path: '/closet', label: 'Closet', icon: Shirt },
  { path: '/advisor', label: 'Advisor', icon: Sparkles },
  { path: '/designer', label: 'Designer', icon: Palette },
  { path: '/catalog', label: 'Catalog', icon: BookOpen },
];

function MaisonNav() {
  const { maisonName, config } = useMaison();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoUrl = config.branding?.logo_url;

  return (
    <nav className="border-b border-[var(--maison-primary)]/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Name */}
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={maisonName} className="h-8 w-auto" />
            ) : (
              <span
                className="text-xl font-display font-bold"
                style={{ color: 'var(--maison-primary)' }}
              >
                {maisonName}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = pathname === path || pathname.startsWith(path + '/');
              return (
                <Link
                  key={path}
                  href={path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[var(--maison-accent)]/10 text-[var(--maison-accent)]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 pb-4">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[var(--maison-accent)]/10 text-[var(--maison-accent)]'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

export function MaisonShell({
  children,
  maisonId,
  maisonName,
  config,
}: {
  children: React.ReactNode;
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
}) {
  return (
    <MaisonProvider
      maisonId={maisonId}
      maisonName={maisonName}
      config={config}
      isWhiteLabel={true}
    >
      {/* Dynamic branding CSS variables */}
      <style>{`
        :root {
          --maison-primary: ${config.branding?.primary_color || '#0A0A0A'};
          --maison-accent: ${config.branding?.accent_color || '#B8943A'};
          --maison-bg: ${config.branding?.background_color || '#FFFFFF'};
          --maison-text: ${config.branding?.text_color || '#0A0A0A'};
        }
      `}</style>
      <MaisonNav />
      <main className="py-6 px-4 sm:px-6">
        {children}
      </main>
    </MaisonProvider>
  );
}
