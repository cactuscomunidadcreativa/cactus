'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { Reveal } from './motion';
import { PROJECTS, type Project } from './showcase-data';

const ease = [0.21, 0.47, 0.32, 0.98] as const;

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const href = project.url ?? project.internalUrl;
  const external = Boolean(project.url);
  const reverse = index % 2 === 1;

  return (
    <article
      id={project.id}
      className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center scroll-mt-24"
    >
      {/* Portada */}
      <Reveal className={reverse ? 'lg:order-2' : ''}>
        <div
          className="relative aspect-[4/3] rounded-3xl overflow-hidden grain"
          style={{
            background: `linear-gradient(140deg, ${project.colorDark} 10%, ${project.color}40 100%)`,
          }}
        >
          <span
            className="absolute -bottom-16 -right-6 font-display font-bold leading-none select-none"
            style={{ fontSize: '22rem', color: `${project.color}26` }}
            aria-hidden="true"
          >
            {project.name.charAt(0)}
          </span>
          <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10">
            <span
              className="self-start px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border"
              style={{
                color: project.accent,
                borderColor: `${project.accent}55`,
                background: `${project.colorDark}aa`,
              }}
            >
              {project.category}
            </span>
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">
                {project.name}
              </h2>
              <p
                className="mt-2 font-editorial italic text-lg md:text-xl"
                style={{ color: project.accent }}
              >
                {project.tagline}
              </p>
            </div>
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }}
          />
        </div>
      </Reveal>

      {/* Detalle */}
      <Reveal delay={0.1} className={reverse ? 'lg:order-1' : ''}>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold" style={{ color: project.color }}>
            {project.client}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono text-muted-foreground">{project.year}</span>
        </div>

        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        <ul className="mt-6 space-y-3">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3 text-sm md:text-base">
              <span
                className="mt-1 flex w-5 h-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${project.color}1a`, color: project.color }}
              >
                <Check className="w-3 h-3" />
              </span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>

        {href && (
          <Link
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="group mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: project.color }}
          >
            {external ? 'Visitar proyecto' : 'Explorar'}
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </Reveal>
    </article>
  );
}

export function ProjectsShowcase() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink grain grid-lines overflow-hidden">
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cactus-green/15 blur-[130px]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green-light mb-6"
          >
            Portafolio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-display text-5xl md:text-7xl font-bold text-white tracking-tight max-w-4xl"
          >
            Cada proyecto,{' '}
            <span className="font-editorial italic font-medium text-gradient-cactus">
              una historia viva
            </span>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
          >
            De un peleador de UFC a un centro de arbitraje. De la inteligencia
            emocional a la financiera. Todo lo que ves aquí está en producción,
            con usuarios reales.
          </motion.p>
        </div>
      </section>

      {/* Proyectos */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 space-y-28 md:space-y-40">
          {PROJECTS.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="pb-24 md:pb-32">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="relative bg-ink grain rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-cactus-green/15 blur-[120px]" />
              <h2 className="relative font-display text-3xl md:text-5xl font-bold text-white tracking-tight">
                El siguiente proyecto de esta página{' '}
                <span className="font-editorial italic font-medium text-gradient-cactus">
                  puede ser el tuyo
                </span>
                .
              </h2>
              <Link
                href="/#contacto"
                className="relative mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cactus-green text-white font-semibold hover:bg-cactus-green-light hover:text-[#07120c] transition-all duration-300"
              >
                Hablemos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
