'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LanguageSelector } from '@/components/shared/language-selector';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { User, LogOut, Settings, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  onToggleMobileSidebar?: () => void;
}

export function Header({ userName, userEmail, onToggleMobileSidebar }: HeaderProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden p-2 hover:bg-muted rounded-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LanguageSelector />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-cactus-green/10 flex items-center justify-center">
              <User className="h-4 w-4 text-cactus-green" />
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {userName || userEmail || ''}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t('settings')}
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
