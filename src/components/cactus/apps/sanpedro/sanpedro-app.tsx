'use client';

import { Sparkles } from 'lucide-react';
import { CreativeStudio, type StudioAgent, type StudioConfig } from '@/components/cactus/apps/shared/creative-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: StudioConfig = {
  greeting: '✨', subtitle: 'Animación con San Pedro', createIcon: Sparkles, createLabel: 'Nueva animación', outputLabel: 'Storyboard',
  fields: [
    { key: 'concepto', label: 'Concepto / qué animar', type: 'text', placeholder: 'Logo, personaje, explainer…' },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Logo animado', 'Explainer animado', 'Personaje', 'Intro / outro', 'Transiciones', 'Microanimación UI'] },
    { key: 'estilo', label: 'Estilo', type: 'select', options: ['2D', '3D', 'Motion graphics', 'Stop-motion', 'Mixto'] },
    { key: 'duracion', label: 'Duración', type: 'select', options: ['3-5s', '10s', '15s', '30s', '60s'] },
    { key: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Marca, paleta, referencia, tono…' },
  ],
  titleKey: 'concepto',
  systemRole: 'Eres San Pedro, animador y director de motion.',
  task: 'Crea un concepto de animación + storyboard: 1) Idea y look general, 2) Storyboard por frames/escenas (descripción visual, movimiento/cámara, timing aprox), 3) Notas de motion (easing, ritmo, transiciones), 4) Paleta y estilo. Claro y producible.',
  docLabel: 'Adjuntar referencia',
  docIntro: 'Apóyate en esta referencia',
  kpis: [{ label: 'Proyectos' }, { label: 'Borradores' }, { label: 'Renders', locked: true, hint: 'Conecta render IA' }, { label: 'Aprobados', locked: true, hint: 'Flujo de revisión' }],
  locked: { title: 'Render de animación', text: 'El render real (Runway, Kling, Luma) y el flujo de versiones/aprobación se activan al conectar el proveedor (Fase F). Hoy San Pedro entrega el concepto y storyboard.' },
  storageKey: 'cactus.sanpedro.projects.v1',
  maxTokens: 1800,
};

export function SanPedroApp(props: { agent: StudioAgent; user?: ShellUser; credits?: number }) {
  return <CreativeStudio {...props} config={config} />;
}
