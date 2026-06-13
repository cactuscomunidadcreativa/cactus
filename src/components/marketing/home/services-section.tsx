'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { SERVICES } from '../showcase-data';

export function ServicesSection() {
  return (
    <section id="servicios" className="py-24 md:py-32 bg-muted/40 border-y">
      <div className="container mx-auto px-4">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green mb-4">
            Lo que hacemos
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mb-14">
            Un estudio,{' '}
            <span className="font-editorial italic font-medium text-cactus-green">
              seis maneras
            </span>{' '}
            de transformar tu negocio.
          </h2>
        </Reveal>

        <Stagger className="divide-y border-y">
          {SERVICES.map((service) => (
            <StaggerItem key={service.id}>
              <Link
                href={`/servicios#${service.id}`}
                className="group grid md:grid-cols-12 gap-4 md:gap-8 items-start py-8 md:py-10 hover:bg-background/80 transition-colors duration-300 md:px-6 md:-mx-6 rounded-xl"
              >
                <span
                  className="md:col-span-1 font-mono text-sm pt-1.5 transition-colors"
                  style={{ color: service.color }}
                >
                  {service.number}
                </span>
                <div className="md:col-span-4">
                  <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight group-hover:text-cactus-green transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-1 font-editorial italic text-muted-foreground">
                    {service.hook}
                  </p>
                </div>
                <p className="md:col-span-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <div className="md:col-span-3 flex items-start justify-between gap-3">
                  <p className="text-xs md:text-sm leading-relaxed">
                    <span className="font-semibold" style={{ color: service.color }}>
                      Prueba:
                    </span>{' '}
                    <span className="text-muted-foreground">{service.proof}</span>
                  </p>
                  <ArrowUpRight className="w-4 h-4 shrink-0 mt-1 text-muted-foreground transition-all duration-300 group-hover:text-cactus-green group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-12">
          <Link
            href="/servicios"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-cactus-green transition-colors"
          >
            Explorar todos los servicios en detalle
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
