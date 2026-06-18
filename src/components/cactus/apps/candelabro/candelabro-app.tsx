'use client';

import { Clapperboard } from 'lucide-react';
import { CreativeStudio, type StudioAgent, type StudioConfig } from '@/components/cactus/apps/shared/creative-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: StudioConfig = {
  greeting: '🎬', subtitle: 'Video con Candelabro', createIcon: Clapperboard, createLabel: 'Nuevo video', outputLabel: 'Tratamiento',
  fields: [
    { key: 'tema', label: 'Tema / producto', type: 'text', placeholder: 'Qué promocionas o cuentas' },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Reel / TikTok', 'Comercial', 'Explainer', 'Testimonial', 'Video corporativo'] },
    { key: 'duracion', label: 'Duración', type: 'select', options: ['15s', '30s', '60s', '90s', '2-3 min'] },
    { key: 'tono', label: 'Tono', type: 'select', options: ['Energético', 'Emotivo', 'Profesional', 'Divertido', 'Aspiracional'] },
    { key: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Mensaje clave, marca, CTA…' },
  ],
  titleKey: 'tema',
  systemRole: 'Eres Candelabro, director de video creativo.',
  task: 'Crea un tratamiento de video listo para producir: 1) Concepto/idea central, 2) Guion por escenas (cada escena con descripción visual, texto en pantalla y/o voz en off, y duración aproximada), 3) Música y ritmo sugeridos, 4) CTA final. Práctico y filmable.',
  docLabel: 'Adjuntar brief',
  docIntro: 'Apóyate en este brief',
  kpis: [{ label: 'Proyectos' }, { label: 'Borradores' }, { label: 'Renders', locked: true, hint: 'Conecta render IA' }, { label: 'Publicados', locked: true, hint: 'Al exportar' }],
  locked: { title: 'Render con IA', text: 'La generación de video real (Kling, Runway, Google Veo) se activa al conectar el proveedor (Fase F). Hoy Candelabro entrega el guion y storyboard listos para producir.' },
  storageKey: 'cactus.candelabro.projects.v1',
  maxTokens: 1800,
};

export function CandelabroApp(props: { agent: StudioAgent; user?: ShellUser; credits?: number }) {
  return <CreativeStudio {...props} config={config} />;
}
