'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Settings, ChevronRight, Shield } from 'lucide-react';
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
              return (
                <Link
                  key={sub.app_id}
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
                  <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
