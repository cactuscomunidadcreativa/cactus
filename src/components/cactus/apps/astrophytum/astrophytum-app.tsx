'use client';

import { VisualStudio, type VisualAgent, type VisualConfig } from '@/components/cactus/apps/shared/visual-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: VisualConfig = {
  mode: 'character', greeting: '⭐', subtitle: 'Personajes y mascotas con Astrophytum',
  genLabel: 'Crear personaje',
  promptPlaceholder: 'Ej. mascota de marca: un cactus amigable con ojos grandes, estilo 3D, paleta verde…',
};

export function AstrophytumApp(props: { agent: VisualAgent; user?: ShellUser; credits?: number }) {
  return <VisualStudio {...props} config={config} />;
}
