'use client';

import { CreativeWorkspace, type WsAgent, type WsConfig } from '@/components/cactus/apps/shared/creative-workspace';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: WsConfig = {
  mode: 'design', greeting: '🎨', subtitle: 'Diseño gráfico con Cardón',
  genLabel: 'Diseñar pieza',
  promptPlaceholder: 'Ej. flyer de promo 2x1 para cafetería, estilo minimalista, colores cálidos…',
  changePlaceholder: 'Pide un cambio a la pieza…',
  uploadHint: 'Sube una imagen o plantilla para editarla',
};

export function CardonApp(props: { agent: WsAgent; user?: ShellUser; credits?: number }) {
  return <CreativeWorkspace {...props} config={config} />;
}
