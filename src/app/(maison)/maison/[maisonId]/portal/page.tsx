import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { createServiceClient } from '@/lib/supabase/service';
import { ClientPortal } from '@/modules/cereus/components/client-portal';
import { redirect } from 'next/navigation';

export default async function MaisonPortalRoute({
  params,
  searchParams,
}: {
  params: Promise<{ maisonId: string }>;
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { maisonId } = await params;
  const { clientId: queryClientId } = await searchParams;
  const { user, maisonName, config } = await authenticateMaisonUser(maisonId);

  // Resolve clientId: use query param if provided, otherwise look up by auth user email
  let clientId = queryClientId || '';

  if (!clientId) {
    const db = createServiceClient();
    if (db && user.email) {
      const { data: client } = await db
        .from('cereus_clients')
        .select('id')
        .eq('maison_id', maisonId)
        .eq('email', user.email)
        .eq('activo', true)
        .limit(1)
        .single();

      if (client) {
        clientId = client.id;
      }
    }
  }

  if (!clientId) {
    // No client found for this user — show a message or redirect
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold mb-2">Portal no disponible</h2>
          <p className="text-sm text-gray-500">
            No se encontro un perfil de cliente asociado a tu cuenta. Contacta al equipo de {maisonName} para configurar tu acceso.
          </p>
        </div>
      </div>
    );
  }

  return <ClientPortal maisonId={maisonId} maisonName={maisonName} clientId={clientId} config={config} />;
}
