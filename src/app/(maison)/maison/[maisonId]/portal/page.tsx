import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { ClientPortal } from '@/modules/cereus/components/client-portal';

export default async function MaisonPortalRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return <ClientPortal maisonId={maisonId} maisonName={maisonName} config={config} />;
}
