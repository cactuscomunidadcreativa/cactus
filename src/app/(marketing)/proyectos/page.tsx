import type { Metadata } from 'next';
import { ProjectsShowcase } from '@/components/marketing/projects-showcase';

export const metadata: Metadata = {
  title: 'Proyectos — Rowi, MadCat, EGO Cloud, SCA y más | Cactus',
  description:
    'Portafolio de Cactus Comunidad Creativa: plataformas de IA emocional, sitios cinematográficos para UFC, SaaS financiero, software de control arbitral y un ecosistema propio de apps.',
};

export default function ProyectosPage() {
  return <ProjectsShowcase />;
}
