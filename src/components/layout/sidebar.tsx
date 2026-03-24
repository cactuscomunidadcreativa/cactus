'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, Settings, ChevronRight, Shield,
  Users, Layers, DollarSign, Factory, Ruler, Shirt, Brain, Eye, BarChart3, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSubscription {
  app_id: string;
  app_name: string;
  app_icon: string;
  app_color: string;
  status: string;
}

interface SidebarProps {
  subscriptions: AppSubscription[];
  isAdmin?: boolean;
}

export function Sidebar({ subscriptions, isAdmin }: SidebarProps) {
  const t = useTranslations('platform.sidebar');
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/marketplace', label: t('marketplace'), icon: Store },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trialing'
  );

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌵</span>
          <span className="font-display font-bold text-lg text-cactus-green">Cactus</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin link */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <Shield className="h-4 w-4" />
            {t('admin')}
          </Link>
        )}

        {/* Subscribed Apps */}
        {activeSubscriptions.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t('myApps')}
            </p>
            {activeSubscriptions.map((sub) => {
              const href = `/apps/${sub.app_id}`;
              const isActive = pathname.startsWith(href);
              const isCereus = sub.app_id === 'cereus';
              const isInsideCereus = isCereus && pathname.startsWith('/apps/cereus');

              return (
                <div key={sub.app_id}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{ backgroundColor: sub.app_color + '20', color: sub.app_color }}
                    >
                      {sub.app_icon}
                    </span>
                    {sub.app_name}
                    <ChevronRight className={cn('h-3 w-3 ml-auto opacity-50 transition-transform', isInsideCereus && 'rotate-90')} />
                  </Link>

                  {/* CEREUS sub-navigation */}
                  {isInsideCereus && (
                    <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5 mt-1 mb-2">
                      {[
                        { href: '/apps/cereus/designer', label: 'Designer', icon: Layers },
                        { href: '/apps/cereus/costing', label: 'Costeo', icon: DollarSign },
                        { href: '/apps/cereus/patterns', label: 'Moldes', icon: Ruler },
                        { href: '/apps/cereus/production', label: 'Produccion', icon: Factory },
                        { href: '/apps/cereus/clients', label: 'Clientes', icon: Users },
                        { href: '/apps/cereus/closet', label: 'Closet', icon: Shirt },
                        { href: '/apps/cereus/advisor', label: 'Advisor', icon: Brain },
                        { href: '/apps/cereus/catalog', label: 'Catalogo', icon: Eye },
                        { href: '/apps/cereus/analytics', label: 'Analytics', icon: BarChart3 },
                      ].map((item) => {
                        const subActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors',
                              subActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                            )}
                          >
                            <item.icon className="h-3.5 w-3.5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
