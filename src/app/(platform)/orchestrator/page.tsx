import { RamonaConsole } from '@/components/cactus/ramona-console';
import { PageHeader } from '@/components/cactus/page-header';

export const metadata = { title: 'Ramona · Orquestadora' };

export default function OrchestratorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        emoji="🌵"
        title="Ramona · Orquestadora"
        subtitle="Dile un objetivo y arma el equipo de agentes — y ejecuta lo que ya está vivo."
      />
      <RamonaConsole />
    </div>
  );
}
