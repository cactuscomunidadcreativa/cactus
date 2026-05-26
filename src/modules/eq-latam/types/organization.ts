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
  | 'partners'       // Partner relations CRM (Eduardo only)
  | 'system';        // Admin: users, permissions, settings (Eduardo only)

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

/**
 * Partner tier definitions. Wholesale discount applied to retail price.
 * Eligibility band by YTD PAX delivered.
 *
 * Volume bonus per event applies on top:
 *   - 5-9 PAX:    no extra
 *   - 10-14 PAX:  -3% extra
 *   - 15+ PAX:    -5% extra
 *
 * Combined cap: -35% off retail. Below the technical floor (15% margin
 * target by default), system alerts the admin.
 */
export interface PartnerTierConfig {
  tier: PartnerTier;
  label: string;
  discount_pct: number;        // -0.15 .. -0.30
  min_ytd_pax: number;
  max_ytd_pax: number | null;  // null = unbounded
  description: string;
}

export const PARTNER_TIERS: PartnerTierConfig[] = [
  { tier: 'EXPLORER',  label: 'Explorer',  discount_pct: 0.15, min_ytd_pax: 0,   max_ytd_pax: 20,  description: '1-20 PAX/año' },
  { tier: 'GROWTH',    label: 'Growth',    discount_pct: 0.20, min_ytd_pax: 21,  max_ytd_pax: 50,  description: '21-50 PAX/año' },
  { tier: 'STRATEGIC', label: 'Strategic', discount_pct: 0.25, min_ytd_pax: 51,  max_ytd_pax: 100, description: '51-100 PAX/año' },
  { tier: 'ELITE',     label: 'Elite',     discount_pct: 0.30, min_ytd_pax: 101, max_ytd_pax: null, description: '100+ PAX/año' },
];

export const PARTNER_VOLUME_BONUS_CAP_PCT = 0.05;
export const PARTNER_COMBINED_DISCOUNT_CAP_PCT = 0.35;

/**
 * Returns the volume bonus for a single event based on PAX count.
 */
export function volumeBonusForPax(pax: number): number {
  if (pax >= 15) return 0.05;
  if (pax >= 10) return 0.03;
  return 0;
}

/**
 * Returns the tier config for a partner.
 */
export function getTierConfig(tier: PartnerTier): PartnerTierConfig {
  return PARTNER_TIERS.find(t => t.tier === tier)!;
}

/**
 * Suggests the next tier based on YTD PAX (auto-promotion preview).
 */
export function suggestTierForYtdPax(ytdPax: number): PartnerTier {
  for (const t of PARTNER_TIERS) {
    if (ytdPax >= t.min_ytd_pax && (t.max_ytd_pax === null || ytdPax <= t.max_ytd_pax)) {
      return t.tier;
    }
  }
  return 'EXPLORER';
}

export interface PartnerCustomPricing {
  /** Override of the Full EQ Week retail price the partner charges their client. */
  full_eq_week_retail_per_pax_usd?: number;
  /** Per-service retail overrides keyed by service code. */
  services?: Record<string, number>;
}

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
  /** Partner's saved retail prices — pre-populate the cotizador. */
  custom_pricing?: PartnerCustomPricing;
}

/**
 * A quote (cotización) — every time someone generates a partner proposal
 * a row is created. When the partner says "deal closed", we promote it
 * to a real Deal and bump partner/referrer YTD.
 */
export interface Quote {
  id: string;
  partner_id?: string;
  referrer_id?: string;
  product_code: string;             // 'FULL_EQ_WEEK' or service code
  client_name?: string;
  city?: string;
  country: 'PE' | 'CO' | 'MX' | 'OTHER';
  pax?: number;
  retail_per_pax_usd?: number;
  wholesale_per_pax_usd?: number;
  retail_total_usd: number;
  wholesale_total_usd: number;
  partner_gross_usd: number;
  status: 'draft' | 'sent' | 'closed' | 'lost';
  pdf_filename?: string;
  notes?: string;
  created_at: string;
  closed_at?: string;
  closed_deal_id?: string;
}

/**
 * Contact person at a partner organization.
 * One partner can have multiple contacts (lead + collaborators).
 * Contacts get invited via magic-link email and see ONLY their own partner's data.
 */
export interface PartnerContact {
  id: string;
  partner_id: string;
  name: string;
  email: string;
  role: 'lead' | 'collaborator';
  invited_at?: string;       // ISO when invite was sent
  accepted_at?: string;      // ISO when they accepted
  last_login_at?: string;
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
