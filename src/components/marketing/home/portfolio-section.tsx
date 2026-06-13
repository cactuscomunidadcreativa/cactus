'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../motion';
import { PROJECTS, type Project } from '../showcase-data';

// Portada tipográfica de cada proyecto — sin screenshots falsos:
// dirección de arte con el color y la inicial de cada marca.
function ProjectCover({ project }: { project: Project }) {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-t-2xl"
      style={{
        background: `linear-gradient(135deg, ${project.colorDark} 0%, ${project.color}33 100%)`,
      }}
    >
      {/* Inicial gigante */}
      <span
        className="absolute -bottom-10 -right-4 font-display font-bold leading-none select-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
        style={{ fontSize: '16rem', color: `${project.color}2e` }}
        aria-hidden="true"
      >
        {project.name.charAt(0)}
      </span>

      {/* Línea de horizonte */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }}
      />

      {/* Wordmark */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
        <div className="flex items-center justify-between">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border"
            style={{ color: project.accent, borderColor: `${project.accent}55`, background: `${project.colorDark}aa` }}
          >
            {project.category}
          </span>
          <span className="text-xs font-mono" style={{ color: `${project.accent}99` }}>
            {project.year}
          </span>
        </div>
        <div>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            {project.name}
          </h3>
          <p className="mt-1 font-editorial italic text-base md:text-lg" style={{ color: project.accent }}>
            {project.tagline}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const href = project.url ?? project.internalUrl ?? '/proyectos';
  const external = Boolean(project.url);

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group block card-glow rounded-2xl border bg-card hover:border-transparent hover:shadow-2xl"
      style={{ ['--tw-shadow-color' as string]: `${project.color}30` }}
    >
      <ProjectCover project={project} />
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: project.color }}>
              {project.client}
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          </div>
          <span
            className="shrink-0 mt-1 inline-flex w-10 h-10 items-center justify-center rounded-full border transition-all duration-300 group-hover:text-white"
            style={{ borderColor: `${project.color}40`, color: project.color }}
          >
            <ArrowUpRight
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function PortfolioSection() {
  const featured = PROJECTS.filter((p) => p.featured);

  return (
    <section id="proyectos" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green mb-4">
                Proyectos reales, en producción
              </p>
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
                No mostramos mockups.{' '}
                <span className="font-editorial italic font-medium text-cactus-green">
                  Mostramos productos vivos.
                </span>
              </h2>
            </div>
            <Link
              href="/proyectos"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-cactus-green transition-colors whitespace-nowrap"
            >
              Ver todos los proyectos
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-6 md:gap-8">
          {featured.map((project) => (
            <StaggerItem key={project.id}>
              <ProjectCard project={project} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
