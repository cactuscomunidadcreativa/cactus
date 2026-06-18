'use client';

import { CreativeWorkspace, type WsAgent, type WsConfig } from '@/components/cactus/apps/shared/creative-workspace';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: WsConfig = {
  mode: 'photo', greeting: '📷', subtitle: 'Fotografía IA con Lente',
  genLabel: 'Generar foto',
  promptPlaceholder: 'Ej. foto de producto de un perfume sobre mármol, luz suave, fondo neutro…',
  changePlaceholder: 'Pide un cambio a la foto (fondo, luz, encuadre…)',
  uploadHint: 'Sube una foto o pose para componer la sesión',
};

export function LenteApp(props: { agent: WsAgent; user?: ShellUser; credits?: number }) {
  return <CreativeWorkspace {...props} config={config} />;
}
