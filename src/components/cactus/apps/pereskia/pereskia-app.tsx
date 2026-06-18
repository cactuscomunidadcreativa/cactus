'use client';

import { Music } from 'lucide-react';
import { CreativeStudio, type StudioAgent, type StudioConfig } from '@/components/cactus/apps/shared/creative-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: StudioConfig = {
  greeting: '🎵', subtitle: 'Música y audio con Pereskia', createIcon: Music, createLabel: 'Nueva pista', outputLabel: 'Brief musical',
  fields: [
    { key: 'proyecto', label: 'Proyecto / uso', type: 'text', placeholder: 'Jingle de marca, fondo para reel…' },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Jingle', 'Música de fondo', 'Sound design', 'Intro de podcast', 'Audio branding'] },
    { key: 'genero', label: 'Género', type: 'select', options: ['Pop', 'Electrónica', 'Acústico', 'Corporativo', 'Lo-fi', 'Cinemático', 'Hip-hop'] },
    { key: 'mood', label: 'Mood', type: 'select', options: ['Alegre', 'Épico', 'Relajado', 'Inspirador', 'Misterioso', 'Elegante'] },
    { key: 'duracion', label: 'Duración', type: 'select', options: ['5-10s', '15s', '30s', '60s', '2-3 min'] },
    { key: 'voz', label: 'Voz', type: 'select', options: ['Instrumental', 'Con voz / letra'] },
  ],
  titleKey: 'proyecto',
  systemRole: 'Eres Pereskia, productora musical y de audio.',
  task: 'Crea un brief de producción musical: 1) Concepto y referencias (artistas/estilo), 2) Estructura por secciones (intro, desarrollo, clímax, cierre) con timing, 3) Instrumentación y sonido, 4) BPM y tonalidad sugeridos, 5) Si lleva voz, una propuesta de letra. Claro y producible.',
  docLabel: 'Adjuntar referencia',
  docIntro: 'Apóyate en esta referencia',
  kpis: [{ label: 'Proyectos' }, { label: 'Borradores' }, { label: 'Pistas', locked: true, hint: 'Conecta producción IA' }, { label: 'Entregas', locked: true, hint: 'Al exportar' }],
  locked: { title: 'Producción de audio', text: 'La generación de la pista real (Suno, Udio, Google Lyria) se activa al conectar el proveedor (Fase F). Hoy Pereskia entrega el brief y la estructura listos para producir.' },
  storageKey: 'cactus.pereskia.projects.v1',
  maxTokens: 1600,
};

export function PereskiaApp(props: { agent: StudioAgent; user?: ShellUser; credits?: number }) {
  return <CreativeStudio {...props} config={config} />;
}
