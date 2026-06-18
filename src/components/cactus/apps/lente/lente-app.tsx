'use client';

import { VisualStudio, type VisualAgent, type VisualConfig } from '@/components/cactus/apps/shared/visual-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: VisualConfig = {
  mode: 'photo', greeting: '📷', subtitle: 'Fotografía IA con Lente',
  genLabel: 'Generar foto',
  promptPlaceholder: 'Ej. foto de producto de un perfume sobre mármol, luz suave, fondo neutro…',
};

export function LenteApp(props: { agent: VisualAgent; user?: ShellUser; credits?: number }) {
  return <VisualStudio {...props} config={config} />;
}
