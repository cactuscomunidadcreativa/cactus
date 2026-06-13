import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { FOOTER_LINKS } from './nav-links';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-ink grain text-white overflow-hidden">
      <div className="container relative mx-auto px-4 pt-16 pb-10">
        {/* CTA superior */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-12 border-b border-white/10">
          <p className="font-display text-2xl md:text-4xl font-bold tracking-tight max-w-xl">
            ¿Construimos algo{' '}
            <span className="font-editorial italic font-medium text-gradient-cactus">
              juntos
            </span>
            ?
          </p>
          <Link
            href="/#contacto"
            className="group inline-flex items-center gap-2 self-start px-7 py-3.5 rounded-full bg-cactus-green text-white font-semibold hover:bg-cactus-green-light hover:text-[#07120c] transition-all duration-300 whitespace-nowrap"
          >
            Empezar conversación
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/cactus.png" alt="Cactus" width={36} height={36} className="rounded-lg" />
              <span className="font-display font-bold text-lg">
                Cactus<span className="text-cactus-green-light">.</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Estudio de IA &amp; software con alma. Construimos productos que
              se sienten humanos — desde Lima para toda LATAM.
            </p>
            <div className="mt-5 space-y-1.5 text-sm">
              <a
                href="https://wa.me/17863954654"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-white/60 hover:text-cactus-green-light transition-colors"
              >
                +1 (786) 395-4654
              </a>
              <a
                href="mailto:eduardo@cactuscomunidadcreativa.com"
                className="block text-white/60 hover:text-cactus-green-light transition-colors"
              >
                eduardo@cactuscomunidadcreativa.com
              </a>
            </div>
          </div>

          {/* Proyectos */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-widest uppercase text-white/40">
              Proyectos
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.proyectos.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-cactus-green-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Apps */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-widest uppercase text-white/40">
              Apps
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.apps.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-cactus-green-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Estudio */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-widest uppercase text-white/40">
              Estudio
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.estudio.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-cactus-green-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-cactus-green-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {currentYear} Cactus Comunidad CreatIVA. Todos los derechos reservados.
            </p>
            <span className="text-sm text-white/40">
              Hecho con 💚 e inteligencia (artificial y emocional) en Latinoamérica
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
