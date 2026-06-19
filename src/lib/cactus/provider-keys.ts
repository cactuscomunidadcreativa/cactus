// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Resolución de llaves BYOK (bring-your-own-key)
// Prefiere la llave que la EMPRESA conectó en /empresa/conexiones; si no hay,
// cae a la llave de plataforma (admin). Así, cuando un usuario conecta sus
// herramientas, sus agentes empiezan a funcionar con SUS llaves.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getIntegrationSecret } from '@/lib/cactus/integration-store';

/** Llave conectada por la empresa activa para una integración (o null). */
export async function companyKey(slug: string, field = 'api_key'): Promise<string | null> {
  try {
    const db = await createClient();
    if (!db) return null;
    const { data: { user } } = await db.auth.getUser();
    if (!user) return null;
    const companyId = await getActiveCompanyId(db, user.id);
    if (!companyId) return null;
    return await getIntegrationSecret(db, companyId, slug, field);
  } catch {
    return null;
  }
}
