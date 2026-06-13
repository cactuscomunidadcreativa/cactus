'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ArrowUpRight, MessageCircle } from 'lucide-react';
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#07120c] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <Image src="/cactus.png" alt="Cactus" width={28} height={28} className="rounded-md" />
            <span className="font-display font-bold text-white">
              Cactus<span className="text-cactus-green-light">.</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1 flex-1">
          {MARKETING_NAV.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-lg font-display font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
              <span className="font-mono text-xs text-cactus-green-light/50">
                0{i + 1}
              </span>
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="p-4 space-y-3 border-t border-white/10">
          <Link
            href="/#contacto"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-cactus-green text-white font-semibold hover:bg-cactus-green-light hover:text-[#07120c] transition-colors"
          >
            Hablemos de tu proyecto
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full px-4 py-3 text-center rounded-full border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <a
            href="https://wa.me/17863954654"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white pt-1 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp directo
          </a>
        </div>
      </div>
    </div>
  );
}
