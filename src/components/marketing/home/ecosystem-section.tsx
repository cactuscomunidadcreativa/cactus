'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { APP_INFO } from '../nav-links';

const ATTRIBUTES: Record<string, string> = {
  ramona: 'Empatía',
  tuna: 'Verdad',
  agave: 'Rentabilidad',
  saguaro: 'Flujo',
  pita: 'Resonancia',
  cereus: 'Belleza',
};

export function EcosystemSection() {
  const apps = Object.values(APP_INFO);

  return (
    <section id="ecosistema" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green mb-4">
                Nuestro laboratorio
              </p>
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
                El jardín donde{' '}
                <span className="font-editorial italic font-medium text-cactus-green">
                  probamos todo
                </span>{' '}
                primero.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl text-lg">
                Seis aplicaciones propias, vivas y en producción. Cada una es una
                especie distinta del mismo ecosistema — y la prueba de que lo que
                te vendemos, lo usamos nosotros primero.
              </p>
            </div>
            <Link
              href="/apps"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-cactus-green transition-colors whitespace-nowrap"
            >
              Explorar el App Store
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {apps.map((app) => (
            <StaggerItem key={app.id} className="h-full">
              <Link
                href={app.landing}
                className="group flex h-full flex-col items-center text-center rounded-2xl border bg-card p-6 card-glow hover:shadow-xl"
                style={{ ['--hover-color' as string]: app.color }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                  style={{ backgroundColor: `${app.color}1a` }}
                >
                  <Image
                    src={app.logo}
                    alt={app.name}
                    width={44}
                    height={44}
                    className="object-contain"
                  />
                </div>
                <h3 className="font-display font-bold text-sm tracking-wide">
                  {app.name}
                </h3>
                <p
                  className="mt-1 text-xs font-editorial italic"
                  style={{ color: app.color }}
                >
                  {ATTRIBUTES[app.id]}
                </p>
                <p className="mt-2 text-xs text-muted-foreground leading-snug">
                  {app.tagline}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
