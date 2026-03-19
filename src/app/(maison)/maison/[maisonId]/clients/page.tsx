import { Suspense } from 'react';
import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';
import { CereusClientsRouter } from '@/modules/cereus/components/clients-router';

export default async function MaisonClientsRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return (
    <MaisonShell maisonId={maisonId} maisonName={maisonName} config={config}>
      <div className="max-w-5xl mx-auto">
        <Suspense>
          <CereusClientsRouter />
        </Suspense>
      </div>
    </MaisonShell>
  );
}
