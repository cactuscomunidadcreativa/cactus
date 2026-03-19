import { Suspense } from 'react';
import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';
import { DesignerPage } from '@/modules/cereus/components/designer-page';

export default async function MaisonDesignerRoute({
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
          <DesignerPage />
        </Suspense>
      </div>
    </MaisonShell>
  );
}
