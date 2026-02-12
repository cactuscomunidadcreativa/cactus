'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    setOpen(false);
    // Full reload to re-read cookie on server side
    window.location.reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 hover:bg-muted rounded-md transition-colors text-sm"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase text-xs font-medium">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                loc === locale ? 'font-medium text-cactus-green' : ''
              }`}
            >
              {localeNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
