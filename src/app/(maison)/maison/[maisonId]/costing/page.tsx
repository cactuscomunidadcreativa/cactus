import { Suspense } from 'react';
import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';
import { CereusCostingPage } from '@/modules/cereus/components/costing-page';

export default async function MaisonCostingRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return (
    <MaisonShell maisonId={maisonId} maisonName={maisonName} config={config}>
      <div className="max-w-6xl mx-auto">
        <Suspense>
          <CereusCostingPage />
        </Suspense>
      </div>
    </MaisonShell>
  );
}
