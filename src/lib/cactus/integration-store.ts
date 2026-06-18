// ═══════════════════════════════════════════════════════════════════════════
// CACTUS — Almacén de conexiones de integración (Fase F).
// REUTILIZA la tabla cifrada `agent_secrets` (041, AES-256-GCM) a nivel EMPRESA
// con un agent_slug reservado y name = "${proveedor}:${campo}". Así NO necesita
// migración nueva y aprovecha el cifrado/RLS existentes.
// El valor en claro NUNCA sale al frontend (igual que secrets.ts).
// ═══════════════════════════════════════════════════════════════════════════
import { listAgentSecrets, addAgentSecret, deleteAgentSecret, getAgentSecret, secretsConfigured } from './secrets';
import { getIntegration, requiredFields } from './integrations';

type DB = any;
export { secretsConfigured };

/** agent_slug reservado: las llaves de integración no son de un agente, son de la empresa. */
export const INTEGRATIONS_SLUG = '_integrations';

const fieldName = (slug: string, field: string) => `${slug}:${field}`;
function parseName(name: string): { slug: string; field: string } | null {
  const i = name.indexOf(':');
  if (i <= 0) return null;
  return { slug: name.slice(0, i), field: name.slice(i + 1) };
}

export interface IntegrationStatus {
  slug: string;
  connected: boolean;
  /** pista (last4) de cada campo guardado */
  fields: Record<string, string | null>;
}

/** Estado de conexión de TODAS las integraciones de la empresa (sin valores en claro). */
export async function listIntegrationStatus(db: DB, companyId: string | null): Promise<Record<string, IntegrationStatus>> {
  const out: Record<string, IntegrationStatus> = {};
  if (!db || !companyId) return out;
  const metas = await listAgentSecrets(db, companyId, INTEGRATIONS_SLUG);
  for (const m of metas) {
    const parsed = parseName(m.name);
    if (!parsed) continue;
    const cur = out[parsed.slug] || (out[parsed.slug] = { slug: parsed.slug, connected: false, fields: {} });
    cur.fields[parsed.field] = m.last4 ?? null;
  }
  // "connected" = tiene todos los campos requeridos (api_key) o un access_token (oauth)
  for (const slug of Object.keys(out)) {
    const p = getIntegration(slug);
    if (!p) { out[slug].connected = Object.keys(out[slug].fields).length > 0; continue; }
    if (p.auth === 'oauth') {
      out[slug].connected = 'access_token' in out[slug].fields;
    } else {
      out[slug].connected = requiredFields(p).every((f) => f.key in out[slug].fields);
    }
  }
  return out;
}

/** Guarda (cifrados) los campos de un proveedor api_key. */
export async function connectApiKey(
  db: DB, companyId: string, slug: string, values: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  if (!secretsConfigured()) return { ok: false, error: 'El servidor no tiene CACTUS_SECRETS_KEY. No guardo llaves sin cifrar.' };
  const p = getIntegration(slug);
  if (!p || p.auth !== 'api_key') return { ok: false, error: 'Proveedor inválido.' };
  const missing = requiredFields(p).filter((f) => !((values[f.key] || '').trim()));
  if (missing.length) return { ok: false, error: `Falta: ${missing.map((m) => m.label).join(', ')}.` };
  for (const f of p.fields || []) {
    const v = (values[f.key] || '').trim();
    if (!v) continue; // opcionales vacíos se omiten
    const r = await addAgentSecret(db, companyId, INTEGRATIONS_SLUG, { name: fieldName(slug, f.key), kind: 'integration', value: v });
    if (!r.ok) return r;
  }
  return { ok: true };
}

/** Guarda el token de un proveedor OAuth (lo llama el callback). */
export async function storeOAuthToken(
  db: DB, companyId: string, slug: string, tokens: { access_token: string; refresh_token?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!secretsConfigured()) return { ok: false, error: 'Falta CACTUS_SECRETS_KEY en el servidor.' };
  const r = await addAgentSecret(db, companyId, INTEGRATIONS_SLUG, { name: fieldName(slug, 'access_token'), kind: 'oauth', value: tokens.access_token });
  if (!r.ok) return r;
  if (tokens.refresh_token) {
    await addAgentSecret(db, companyId, INTEGRATIONS_SLUG, { name: fieldName(slug, 'refresh_token'), kind: 'oauth', value: tokens.refresh_token });
  }
  return { ok: true };
}

/** Desconecta un proveedor (borra todos sus campos). */
export async function disconnectIntegration(db: DB, companyId: string, slug: string): Promise<boolean> {
  if (!db || !companyId || !slug) return false;
  const metas = await listAgentSecrets(db, companyId, INTEGRATIONS_SLUG);
  const ids = metas.filter((m) => parseName(m.name)?.slug === slug).map((m) => m.id);
  let ok = true;
  for (const id of ids) ok = (await deleteAgentSecret(db, companyId, INTEGRATIONS_SLUG, id)) && ok;
  return ok;
}

/** SOLO servidor: descifra una llave para que la lógica del agente la use (Fase F futura). */
export async function getIntegrationSecret(db: DB, companyId: string | null, slug: string, field: string): Promise<string | null> {
  if (!companyId) return null;
  return getAgentSecret(db, companyId, INTEGRATIONS_SLUG, fieldName(slug, field));
}
