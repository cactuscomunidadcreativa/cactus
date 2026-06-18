'use client';

import { UserCircle2 } from 'lucide-react';
import { CreativeStudio, type StudioAgent, type StudioConfig } from '@/components/cactus/apps/shared/creative-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: StudioConfig = {
  greeting: '🧑‍🚀', subtitle: 'Avatares y humanos digitales con Ariocarpus', createIcon: UserCircle2, createLabel: 'Nuevo avatar', outputLabel: 'Ficha de avatar',
  fields: [
    { key: 'nombre', label: 'Nombre del avatar', type: 'text', placeholder: 'Ej. Valentina, embajadora de marca' },
    { key: 'rol', label: 'Rol', type: 'select', options: ['Vendedor / asesor', 'Presentador', 'Influencer virtual', 'Embajador de marca', 'Atención al cliente', 'Educador'] },
    { key: 'apariencia', label: 'Apariencia', type: 'textarea', placeholder: 'Edad, estilo, vestuario, rasgos, vibra…' },
    { key: 'personalidad', label: 'Personalidad / tono', type: 'text', placeholder: 'Cercana, experta, divertida…' },
    { key: 'voz', label: 'Voz', type: 'select', options: ['Femenina cálida', 'Masculina firme', 'Neutra joven', 'Energética', 'Serena'] },
    { key: 'uso', label: 'Casos de uso', type: 'text', placeholder: 'Reels, soporte, demos, anuncios…' },
  ],
  titleKey: 'nombre',
  systemRole: 'Eres Ariocarpus, creador de avatares y humanos digitales de marca.',
  task: 'Crea la ficha completa del avatar: 1) Identidad (nombre, edad, look detallado), 2) Personalidad y tono de voz, 3) Mini biografía/historia coherente, 4) Guion de presentación (30s), 5) Prompts visuales sugeridos para generar su imagen y video (descripción para el modelo). Consistente y listo para producir.',
  docLabel: 'Adjuntar referencia / marca',
  docIntro: 'Apóyate en esta referencia de marca',
  kpis: [{ label: 'Avatares' }, { label: 'Fichas' }, { label: 'Renders', locked: true, hint: 'Conecta imagen/video IA' }, { label: 'Publicados', locked: true, hint: 'Al exportar' }],
  locked: { title: 'Generar imagen y video del avatar', text: 'La generación visual real (GPT Image, Kling, Google Veo) y la voz (con Garambullo) se activan al conectar el proveedor (Fase F). Hoy Ariocarpus entrega la ficha y los prompts listos.' },
  storageKey: 'cactus.ariocarpus.projects.v1',
  maxTokens: 1800,
};

export function AriocarpusApp(props: { agent: StudioAgent; user?: ShellUser; credits?: number }) {
  return <CreativeStudio {...props} config={config} />;
}
