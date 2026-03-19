import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonAdmin } from '@/modules/cereus/components/maison-admin';

export default async function MaisonAdminRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return <MaisonAdmin maisonId={maisonId} maisonName={maisonName} config={config} />;
}
