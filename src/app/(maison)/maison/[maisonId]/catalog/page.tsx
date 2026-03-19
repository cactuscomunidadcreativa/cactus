import { Suspense } from 'react';
import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';
import { CatalogPage } from '@/modules/cereus/components/catalog-page';

export default async function MaisonCatalogRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return (
    <MaisonShell maisonId={maisonId} maisonName={maisonName} config={config}>
      <div className="max-w-7xl mx-auto">
        <Suspense>
          <CatalogPage />
        </Suspense>
      </div>
    </MaisonShell>
  );
}
