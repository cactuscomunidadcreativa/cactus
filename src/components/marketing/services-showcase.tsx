'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { Reveal } from './motion';
import { SERVICES, PROCESS } from './showcase-data';

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function ServicesShowcase() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink grain grid-lines overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-cactus-green/15 blur-[130px]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green-light mb-6"
          >
            Servicios
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-display text-5xl md:text-7xl font-bold text-white tracking-tight max-w-4xl"
          >
            Todo lo que tu negocio necesita,{' '}
            <span className="font-editorial italic font-medium text-gradient-cactus">
              construido con alma
            </span>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
          >
            No vendemos horas: entregamos productos funcionando. Cada servicio
            viene respaldado por algo que ya construimos y que puedes tocar.
          </motion.p>
        </div>
      </section>

      {/* Servicios en detalle */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 space-y-20 md:space-y-28">
          {SERVICES.map((service) => (
            <Reveal key={service.id}>
              <article
                id={service.id}
                className="grid lg:grid-cols-12 gap-8 lg:gap-12 scroll-mt-24 border-t pt-12"
              >
                {/* Número + título */}
                <div className="lg:col-span-4">
                  <span
                    className="font-display text-6xl md:text-7xl font-bold"
                    style={{ color: `${service.color}26` }}
                  >
                    {service.number}
                  </span>
                  <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold tracking-tight">
                    {service.title}
                  </h2>
                  <p
                    className="mt-2 font-editorial italic text-lg"
                    style={{ color: service.color }}
                  >
                    {service.hook}
                  </p>
                </div>

                {/* Descripción */}
                <div className="lg:col-span-5">
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                    {service.description}
                  </p>
                  <div
                    className="mt-6 rounded-xl border-l-4 bg-muted/60 p-4 text-sm leading-relaxed"
                    style={{ borderColor: service.color }}
                  >
                    <span className="font-semibold" style={{ color: service.color }}>
                      Ya lo hicimos:
                    </span>{' '}
                    {service.proof}.{' '}
                    <Link
                      href={`/proyectos#${service.proofProject}`}
                      className="inline-flex items-center gap-1 font-semibold hover:underline"
                      style={{ color: service.color }}
                    >
                      Ver el caso
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Entregables */}
                <div className="lg:col-span-3">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
                    Qué recibes
                  </p>
                  <ul className="space-y-3">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <span
                          className="mt-0.5 flex w-4 h-4 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${service.color}1a`, color: service.color }}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proceso resumido */}
      <section className="py-20 bg-muted/40 border-y">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-10">
              ¿Y cómo empezamos?
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-4 gap-6">
            {PROCESS.map((phase, i) => (
              <Reveal key={phase.step} delay={0.1 * i}>
                <div className="rounded-xl border bg-card p-6">
                  <span className="font-mono text-xs text-cactus-green">
                    {phase.step}
                  </span>
                  <h3 className="mt-2 font-display font-bold">{phase.title}</h3>
                  <p className="mt-1 text-xs font-editorial italic text-cactus-green">
                    {phase.subtitle}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <Link
              href="/#contacto"
              className="group mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cactus-green text-white font-semibold hover:bg-cactus-green-light hover:text-[#07120c] transition-all duration-300"
            >
              Empezar una conversación
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
