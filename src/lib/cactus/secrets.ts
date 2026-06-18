// ═══════════════════════════════════════════════════════════════════════════
// Secretos de agente (contraseñas / tokens / API keys). Almacenamiento cifrado.
// REGLA: el valor en claro NUNCA sale al frontend ni a logs. list() devuelve
// solo metadatos (name/kind/last4). getAgentSecret() descifra SOLO en servidor.
// ═══════════════════════════════════════════════════════════════════════════
import { encryptSecret, decryptSecret, lastFour, secretsConfigured } from './crypto';

type DB = any;
export { secretsConfigured };

export interface SecretMeta { id: string; name: string; kind: string; last4: string | null; created_at?: string }

/** Lista metadatos (SIN el valor cifrado). */
export async function listAgentSecrets(db: DB, companyId: string | null, slug: string): Promise<SecretMeta[]> {
  if (!db || !companyId || !slug) return [];
  try {
    const { data } = await db.from('agent_secrets')
      .select('id, name, kind, last4, created_at')   // nunca secret_enc
      .eq('company_id', companyId).eq('agent_slug', slug)
      .order('created_at', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

/** Agrega/actualiza un secreto (cifrado). Rechaza si no hay llave de servidor. */
export async function addAgentSecret(db: DB, companyId: string, slug: string, s: { name: string; kind?: string; value: string }): Promise<{ ok: boolean; error?: string }> {
  if (!secretsConfigured()) return { ok: false, error: 'El servidor no tiene CACTUS_SECRETS_KEY configurada. No guardo secretos sin cifrar.' };
  if (!db || !companyId || !slug || !s?.name || !s?.value) return { ok: false, error: 'Faltan datos (nombre y valor).' };
  const enc = encryptSecret(s.value);
  if (!enc) return { ok: false, error: 'No se pudo cifrar.' };
  try {
    const { error } = await db.from('agent_secrets').upsert(
      { company_id: companyId, agent_slug: slug, name: s.name, kind: s.kind || 'token', secret_enc: enc, last4: lastFour(s.value) },
      { onConflict: 'company_id,agent_slug,name' },
    );
    return { ok: !error, error: error?.message };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error' };
  }
}

export async function deleteAgentSecret(db: DB, companyId: string, slug: string, id: string): Promise<boolean> {
  if (!db || !companyId || !id) return false;
  try {
    const { error } = await db.from('agent_secrets').delete().eq('id', id).eq('company_id', companyId).eq('agent_slug', slug);
    return !error;
  } catch {
    return false;
  }
}

/** SOLO servidor: descifra un secreto para que la lógica del agente lo use. */
export async function getAgentSecret(db: DB, companyId: string | null, slug: string, name: string): Promise<string | null> {
  if (!db || !companyId || !slug || !name) return null;
  try {
    const { data } = await db.from('agent_secrets').select('secret_enc')
      .eq('company_id', companyId).eq('agent_slug', slug).eq('name', name).maybeSingle();
    if (!data?.secret_enc) return null;
    return decryptSecret(data.secret_enc);
  } catch {
    return null;
  }
}
