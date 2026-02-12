import Link from 'next/link';
import { FOOTER_LINKS } from './nav-links';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌵</span>
              <span className="font-display font-bold">Cactus</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Inteligencia en Cada Espina.
              <br />
              Comunidad en Cada Especie.
            </p>
          </div>

          {/* Apps */}
          <div>
            <h4 className="font-semibold mb-4">Apps</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.apps.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Comunidad */}
          <div>
            <h4 className="font-semibold mb-4">Comunidad</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Cactus Comunidad CreatIVA. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              {/* Social links placeholder */}
              <span className="text-sm text-muted-foreground">
                Hecho con 💚 en Latinoamérica
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
