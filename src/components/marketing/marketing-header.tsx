'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, ArrowUpRight } from 'lucide-react';
import { MARKETING_NAV } from './nav-links';
import { MobileNav } from './mobile-nav';

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-[#07120c]/90 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'border-b border-white/10 shadow-lg shadow-black/20' : 'border-b border-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/cactus.png"
                alt="Cactus"
                width={32}
                height={32}
                className="rounded-lg transition-transform duration-300 group-hover:-rotate-6"
              />
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Cactus
                <span className="text-cactus-green-light">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {MARKETING_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-cactus-green-light bg-cactus-green/15'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/#contacto"
                className="group inline-flex items-center gap-1.5 px-5 py-2 bg-cactus-green text-white rounded-full text-sm font-semibold hover:bg-cactus-green-light hover:text-[#07120c] transition-all duration-300"
              >
                Hablemos
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
