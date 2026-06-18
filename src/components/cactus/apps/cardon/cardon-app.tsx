'use client';

import { VisualStudio, type VisualAgent, type VisualConfig } from '@/components/cactus/apps/shared/visual-studio';
import type { ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

const config: VisualConfig = {
  mode: 'design', greeting: '🎨', subtitle: 'Diseño gráfico con Cardón',
  genLabel: 'Diseñar pieza',
  promptPlaceholder: 'Ej. flyer de promo 2x1 para cafetería, estilo minimalista, colores cálidos…',
};

export function CardonApp(props: { agent: VisualAgent; user?: ShellUser; credits?: number }) {
  return <VisualStudio {...props} config={config} />;
}
