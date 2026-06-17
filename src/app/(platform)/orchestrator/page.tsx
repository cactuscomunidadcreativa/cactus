import { RamonaWorkspace } from '@/components/cactus/orchestrator/ramona-workspace';

export const metadata = { title: 'Ramona · Coordinadora General' };

export default function OrchestratorPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <RamonaWorkspace />
    </div>
  );
}
