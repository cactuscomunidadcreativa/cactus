'use client';

import { CreativeWorkspace, type WsAgent, type WsConfig } from '@/components/cactus/apps/shared/creative-workspace';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: WsConfig = {
  mode: 'character', greeting: '⭐', subtitle: 'Personajes y mascotas con Astrophytum',
  genLabel: 'Crear personaje',
  promptPlaceholder: 'Ej. mascota de marca: un cactus amigable con ojos grandes, estilo 3D, paleta verde…',
  changePlaceholder: 'Pide un cambio al personaje (pose, color, expresión…)',
  uploadHint: 'Sube una referencia del personaje',
};

export function AstrophytumApp(props: { agent: WsAgent; user?: ShellUser; credits?: number }) {
  return <CreativeWorkspace {...props} config={config} />;
}
