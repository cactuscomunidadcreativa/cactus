'use client';

import { CreativeWorkspace, type WsAgent, type WsConfig } from '@/components/cactus/apps/shared/creative-workspace';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: WsConfig = {
  mode: 'character', greeting: '🧑‍🚀', subtitle: 'Avatares y humanos digitales con Ariocarpus',
  genLabel: 'Crear avatar',
  promptPlaceholder: 'Ej. avatar de marca: mujer 30s, profesional cercana, estilo realista, fondo neutro…',
  changePlaceholder: 'Pide un cambio (o sube tu foto y di “conviérteme en avatar 3D”)',
  uploadHint: 'Sube TU foto para crear tu propio avatar',
};

export function AriocarpusApp(props: { agent: WsAgent; user?: ShellUser; credits?: number }) {
  return <CreativeWorkspace {...props} config={config} />;
}
