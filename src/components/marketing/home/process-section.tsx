'use client';

import { Reveal, Stagger, StaggerItem } from '../motion';
import { PROCESS } from '../showcase-data';

export function ProcessSection() {
  return (
    <section id="proceso" className="py-24 md:py-32 bg-muted/40 border-y">
      <div className="container mx-auto px-4">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green mb-4">
            Cómo trabajamos
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mb-14">
            Sin humo. Sin PowerPoints eternos.{' '}
            <span className="font-editorial italic font-medium text-cactus-green">
              Producto real, rápido.
            </span>
          </h2>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS.map((phase, i) => (
            <StaggerItem key={phase.step} className="h-full">
              <div className="relative h-full rounded-2xl border bg-card p-8 card-glow hover:shadow-xl hover:border-cactus-green/40">
                <span className="font-display text-5xl font-bold text-cactus-green/15">
                  {phase.step}
                </span>
                {i < PROCESS.length - 1 && (
                  <span className="hidden lg:block absolute top-12 -right-3 w-6 border-t-2 border-dashed border-cactus-green/30" />
                )}
                <h3 className="mt-4 font-display text-xl font-bold">
                  {phase.title}
                </h3>
                <p className="mt-1 text-sm font-editorial italic text-cactus-green">
                  {phase.subtitle}
                </p>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {phase.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
