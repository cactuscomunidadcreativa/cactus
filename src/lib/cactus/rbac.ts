// ═══════════════════════════════════════════════════════════════════════════
// RBAC (Fase A · Acción 8) — roles de membresía + chequeos por acción/ruta.
// Roles: owner, admin, marketing, ventas, legal, ops, invitado, cliente.
// Resiliente: si memberships no existe aún, no bloquea (degrada a permitir).
// ═══════════════════════════════════════════════════════════════════════════
import { isSuperAdmin } from '@/lib/admin/auth';

type DB = any;

export type Role = 'owner' | 'admin' | 'marketing' | 'ventas' | 'legal' | 'ops' | 'invitado' | 'cliente';

export const MANAGER_ROLES: Role[] = ['owner', 'admin'];

/** Rol del usuario en una empresa (null si no es miembro / tabla ausente). */
export async function getRole(db: DB, userId: string | null, companyId: string | null): Promise<Role | null> {
  if (!db || !userId || !companyId) return null;
  try {
    const { data } = await db
      .from('memberships').select('role')
      .eq('user_id', userId).eq('company_id', companyId).maybeSingle();
    return (data?.role as Role) || null;
  } catch {
    return null;
  }
}

/** ¿Puede administrar la empresa? (owner/admin o super-admin). */
export async function canManageCompany(
  db: DB,
  user: { id: string; email?: string | null },
  companyId: string | null,
): Promise<boolean> {
  if (isSuperAdmin(user.email)) return true;
  const role = await getRole(db, user.id, companyId);
  // Fail-closed: sin rol/membresía NO se administra (antes degradaba a permitir,
  // dejando que cualquiera gestionara una empresa si faltaba la fila de membership).
  if (role === null) return false;
  return MANAGER_ROLES.includes(role);
}

/** ¿Tiene alguno de los roles permitidos? (super-admin siempre). */
export async function hasRole(
  db: DB,
  user: { id: string; email?: string | null },
  companyId: string | null,
  allowed: Role[],
): Promise<boolean> {
  if (isSuperAdmin(user.email)) return true;
  const role = await getRole(db, user.id, companyId);
  if (role === null) return true;
  return allowed.includes(role);
}
