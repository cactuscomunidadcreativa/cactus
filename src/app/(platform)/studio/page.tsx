import { DesignStudio } from '@/components/cactus/design-studio';

export const metadata = { title: 'Cardón · Diseño' };

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">🎨 Cardón · Estudio de Diseño</h1>
        <p className="text-sm text-muted-foreground">
          Describe la pieza y Cardón la genera. Primer agente del Omni Creator que produce de verdad.
        </p>
      </header>
      <DesignStudio />
    </div>
  );
}
