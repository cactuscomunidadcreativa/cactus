/**
 * EQ LATAM — Organization Model
 *
 * Defines the people, areas, permissions, partners, and referrers that
 * operate inside the platform. The visibility model lives here:
 *
 *   - Eduardo is admin and sees every area implicitly.
 *   - Everyone else only sees the areas where they have an AreaPermission.
 *   - External actors (partners, referrers) never see internal data.
 */

// ============================================================
// USERS & ROLES
// ============================================================

export type UserRole = 'admin' | 'area_lead' | 'collaborator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  monthly_salary_usd: number;
  active: boolean;
}

// ============================================================
// BUSINESS AREAS
// ============================================================

export type AreaId =
  | 'education'      // Certs + EQ Weeks (Natalia lead)
  | 'assessments'    // Credits + reports (shared: Andreia, Liliana, Otilia viewers)
  | 'eq_biz'         // Consulting EQ Biz (Andreia lead)
  | 'marketing'      // Lead gen + ADS (Karla lead)
  | 'membership'     // Network memberships (Eduardo only)
  | 'impact'         // Social impact programs (Liliana + Otilia)
  | 'operations'     // Admin support function (Natalia + Liliana)
  | 'partners';      // Partner relations CRM (Eduardo only)

export interface BusinessArea {
  id: AreaId;
  name: string;
  emoji: string;
  description: string;
  is_revenue_generating: boolean;
  /** Eduardo-only area, hidden from everyone else even with permissions. */
  admin_only: boolean;
  revenue_target_annual: number;
  cost_allocation_annual: number;
}

// ============================================================
// AREA PERMISSIONS (many-to-many user ↔ area)
// ============================================================

export type PermissionLevel = 'lead' | 'collaborator' | 'viewer';

export interface AreaPermission {
  user_id: string;
  area_id: AreaId;
  level: PermissionLevel;
}

// ============================================================
// PARTNERS (external resellers)
// ============================================================

export type PartnerTier = 'EXPLORER' | 'GROWTH' | 'STRATEGIC' | 'ELITE';

export interface Partner {
  id: string;
  name: string;
  country: 'PE' | 'CO' | 'MX' | 'OTHER';
  tier: PartnerTier;
  /** YTD PAX delivered through this partner's deals. */
  ytd_pax: number;
  ytd_revenue: number;
  /** Customer Acquisition Cost absorbed by 6S Latam for this partner. */
  ytd_cac_absorbed: number;
  active_since: string; // ISO date
  active: boolean;
}

// ============================================================
// REFERRERS (external referrers, NOT partners)
// ============================================================

export interface Referrer {
  id: string;
  name: string;
  email: string;
  /** Default commission rate. Can be overridden per deal. */
  default_commission_pct: number; // e.g. 0.10
  ytd_referred_deals: number;
  ytd_commission_paid: number;
  ytd_revenue_generated: number;
  active: boolean;
  notes?: string;
}

// ============================================================
// VISIBILITY HELPERS
// ============================================================

export interface VisibilityContext {
  current_user: User;
  permissions: AreaPermission[]; // permissions for current_user only
}

/**
 * Returns true if the user can see the given area at all.
 * Admin sees everything. Others need an explicit permission unless
 * the area is admin_only.
 */
export function canUserSeeArea(
  ctx: VisibilityContext,
  area: BusinessArea,
): boolean {
  if (ctx.current_user.role === 'admin') return true;
  if (area.admin_only) return false;
  return ctx.permissions.some(p => p.area_id === area.id);
}

/**
 * Returns the user's permission level on a given area, or null
 * if they have no access. Admin always returns 'lead'.
 */
export function userLevelInArea(
  ctx: VisibilityContext,
  areaId: AreaId,
): PermissionLevel | null {
  if (ctx.current_user.role === 'admin') return 'lead';
  const perm = ctx.permissions.find(p => p.area_id === areaId);
  return perm?.level ?? null;
}
