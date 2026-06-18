// ═══════════════════════════════════════════════════════════════════════════
// Multiempresa — resolución de la "empresa activa" del usuario (Fase A · Acción 2).
// Todo el acceso a datos es RESILIENTE: si las tablas multiempresa aún no se han
// desplegado (organizations/companies/memberships, profiles.primary_company_id),
// devuelve null/[] en vez de romper. Así la UI degrada a "single-tenant" como antes.
// ═══════════════════════════════════════════════════════════════════════════

// `any` para el cliente Supabase: sigue el patrón del resto del código (las queries
// devuelven {data,error} y nunca lanzan; igual envolvemos en try/catch por si acaso).
type DB = any;

export interface UserCompany {
  id: string;
  name: string;
  slug: string | null;
  role: string;
}

/** company_id de la empresa activa: profiles.primary_company_id → 1ª membresía → null. */
export async function getActiveCompanyId(db: DB, userId: string | null | undefined): Promise<string | null> {
  if (!db || !userId) return null;
  try {
    const { data: prof, error: e1 } = await db
      .from('profiles').select('primary_company_id').eq('id', userId).maybeSingle();
    if (!e1 && prof?.primary_company_id) return prof.primary_company_id as string;

    const { data: m, error: e2 } = await db
      .from('memberships').select('company_id')
      .eq('user_id', userId).eq('status', 'active')
      .order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (!e2 && m?.company_id) return m.company_id as string;

    // Sin empresa → auto-aprovisiona (self-healing para usuarios existentes / sin datos).
    // cactus_ensure_default_company es SECURITY DEFINER: crea org+empresa+membresía y
    // setea profiles.primary_company_id; devuelve el company_id.
    try {
      const { data: ensured, error: e3 } = await db.rpc('cactus_ensure_default_company', { p_user: userId });
      if (!e3 && ensured) return ensured as string;
    } catch { /* RPC ausente (multiempresa no desplegada) → null */ }

    return null;
  } catch {
    return null;
  }
}

/** Empresas a las que pertenece el usuario (para el selector del header).
 *  Dos queries (sin embed PostgREST) para no depender del caché de esquema, que
 *  puede ir con retraso justo después del deploy de un clic. */
export async function listUserCompanies(db: DB, userId: string | null | undefined): Promise<UserCompany[]> {
  if (!db || !userId) return [];
  try {
    const { data: mems, error: e1 } = await db
      .from('memberships').select('company_id, role')
      .eq('user_id', userId).eq('status', 'active');
    if (e1 || !mems || mems.length === 0) return [];

    const roleByCompany = new Map<string, string>();
    for (const m of mems as any[]) if (m.company_id) roleByCompany.set(m.company_id, m.role);
    const ids = Array.from(roleByCompany.keys());

    const { data: comps, error: e2 } = await db
      .from('companies').select('id, name, slug').in('id', ids);
    if (e2 || !comps) return [];

    return (comps as any[])
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? null, role: roleByCompany.get(c.id) || 'member' }))
      .filter((c) => c.id && c.name)
      .sort((a, b) => a.name.localeCompare(b.name)) as UserCompany[];
  } catch {
    return [];
  }
}

/** Última marca activa del usuario que cumple el `scope` (filtro extra opcional). */
async function latestActiveBrand(db: DB, userId: string, scope: (q: any) => any): Promise<{ data: any | null; error: any }> {
  const base = db.from('cactus_brand_kits').select('*').eq('user_id', userId).eq('is_active', true);
  const { data, error } = await scope(base).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  return { data: data || null, error };
}

/** Brand Kit activo scopeado por empresa (el contexto de marca que usan los agentes).
 *  - Con empresa activa: prefiere la marca de ESA empresa; si no hay (marca legacy sin
 *    company_id, p. ej. guardada antes de este cableado), cae a la marca activa del usuario.
 *  - Sin empresa (multiempresa no desplegada) o si la columna company_id aún no existe:
 *    comportamiento previo (marca activa del usuario por reciente). */
export async function getActiveBrandKit(
  db: DB,
  userId: string | null | undefined,
  companyId: string | null | undefined,
): Promise<any | null> {
  if (!db || !userId) return null;
  try {
    if (!companyId) {
      const { data } = await latestActiveBrand(db, userId, (q) => q);
      return data;
    }
    const own = await latestActiveBrand(db, userId, (q) => q.eq('company_id', companyId));
    if (own.error) {
      // columna company_id ausente (multiempresa no desplegada) → marca del usuario
      const { data } = await latestActiveBrand(db, userId, (q) => q);
      return data;
    }
    if (own.data) return own.data;
    // marca legacy sin empresa asignada → úsala (se atará al re-guardar / en el backfill)
    const legacy = await latestActiveBrand(db, userId, (q) => q.is('company_id', null));
    return legacy.data;
  } catch {
    return null;
  }
}

/** Cambia la empresa activa (valida membresía). Devuelve true si quedó aplicada. */
export async function setActiveCompany(db: DB, userId: string | null | undefined, companyId: string): Promise<boolean> {
  if (!db || !userId || !companyId) return false;
  try {
    const { data: m } = await db
      .from('memberships').select('id')
      .eq('user_id', userId).eq('company_id', companyId).maybeSingle();
    if (!m) return false; // no es miembro de esa empresa
    const { error } = await db
      .from('profiles').update({ primary_company_id: companyId }).eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}
