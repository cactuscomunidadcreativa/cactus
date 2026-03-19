import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import type { MaisonConfig } from '@/modules/cereus/types';

/**
 * Authenticate user and resolve maison config for white-label routes.
 * Redirects to /login if not authenticated or no access.
 */
export async function authenticateMaisonUser(maisonId: string) {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load maison config
  const service = createServiceClient();
  const maison = service
    ? (await service
        .from('app_clients')
        .select('id, nombre, config')
        .eq('id', maisonId)
        .eq('activo', true)
        .single()
      ).data
    : null;

  if (!maison) redirect('/login');

  const config = (maison.config || {}) as MaisonConfig;

  return {
    user,
    maisonId: maison.id as string,
    maisonName: maison.nombre as string,
    config,
  };
}

/**
 * Load maison config without auth (for public pages like landing, lookbook).
 */
export async function loadMaisonPublic(maisonId: string) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from('app_clients')
    .select('id, nombre, config')
    .eq('id', maisonId)
    .eq('activo', true)
    .single();

  if (!data) return null;

  return {
    maisonId: data.id as string,
    maisonName: data.nombre as string,
    config: (data.config || {}) as MaisonConfig,
  };
}
