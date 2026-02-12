'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { MARKETING_NAV } from './nav-links';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-72 bg-background shadow-xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <span className="text-xl">🌵</span>
            <span className="font-display font-bold">Cactus</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {MARKETING_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block px-4 py-3 rounded-lg text-lg font-medium hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t" />

        {/* Auth Buttons */}
        <div className="p-4 space-y-3">
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full px-4 py-3 text-center rounded-lg border font-medium hover:bg-muted transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="block w-full px-4 py-3 text-center rounded-lg bg-cactus-green text-white font-medium hover:bg-cactus-green/90 transition-colors"
          >
            Comenzar Gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
