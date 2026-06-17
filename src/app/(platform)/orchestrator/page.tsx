import { RamonaConsole } from '@/components/cactus/ramona-console';

export const metadata = { title: 'Ramona · Orquestadora' };

export default function OrchestratorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Ramona · Orquestadora</h1>
        <p className="text-sm text-muted-foreground">
          Dile a Ramona un objetivo y ella arma el equipo de agentes y ejecuta lo que ya está vivo.
        </p>
      </header>
      <RamonaConsole />
    </div>
  );
}
