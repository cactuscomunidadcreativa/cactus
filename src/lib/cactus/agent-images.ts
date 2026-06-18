// ═══════════════════════════════════════════════════════════════════════════
// Imagen EFECTIVA de cada agente (empresa sobre global "Cactus" sobre catálogo).
// Devuelve solo los slugs con override (image_url); el resto usa su imagen del
// catálogo. Resiliente: si la tabla no existe / sin permisos, devuelve {}.
//   • companyId null  → solo overrides globales (para páginas públicas, p.ej. /apps)
//   • companyId set   → global + empresa (la empresa manda)
// ═══════════════════════════════════════════════════════════════════════════
type DB = any;

export async function getEffectiveAgentImages(db: DB, companyId: string | null): Promise<Record<string, string>> {
  if (!db) return {};
  const out: Record<string, string> = {};
  try {
    const { data, error } = await db.from('agent_configs').select('slug, company_id, image_url');
    if (error || !data) return {};
    // Global primero
    for (const r of data) if (r.company_id === null && r.image_url) out[r.slug] = r.image_url;
    // Empresa sobreescribe
    if (companyId) for (const r of data) if (r.company_id === companyId && r.image_url) out[r.slug] = r.image_url;
  } catch {
    return {};
  }
  return out;
}
