/**
 * EQ LATAM — Organization Seed Data
 *
 * The people, areas, permissions, partners, and referrers that operate
 * inside the platform. This is the single source of truth for the
 * organization model — wire UI off this file, not hardcoded names.
 */

import type {
  AreaPermission,
  BusinessArea,
  Partner,
  PartnerContact,
  Referrer,
  User,
  VisibilityContext,
} from '../types/organization';

// ============================================================
// USERS
// ============================================================

export const USERS: User[] = [
  {
    id: 'eduardo',
    name: 'Eduardo González',
    email: 'eduardo@cactuscomunidadcreativa.com',
    role: 'admin',
    monthly_salary_usd: 1500, // Director retainer; 10% sobre ventas es contable
    active: true,
  },
  {
    id: 'natalia',
    name: 'Natalia Vergara',
    email: 'natalia@6seconds.org',
    role: 'area_lead',
    monthly_salary_usd: 600,
    active: true,
  },
  {
    id: 'karla',
    name: 'Karla Parra',
    email: 'karla@6seconds.org',
    role: 'area_lead',
    monthly_salary_usd: 1100, // subió desde $500 al asumir Marketing
    active: true,
  },
  {
    id: 'andreia',
    name: 'Andreia DelPra',
    email: 'andreia@6seconds.org',
    role: 'area_lead',
    monthly_salary_usd: 600,
    active: true,
  },
  {
    id: 'liliana',
    name: 'Liliana Rodríguez',
    email: 'liliana@6seconds.org',
    role: 'area_lead',
    monthly_salary_usd: 600,
    active: true,
  },
  {
    id: 'otilia',
    name: 'Otilia Esquivia',
    email: 'otilia@6seconds.org',
    role: 'collaborator',
    monthly_salary_usd: 300,
    active: true,
  },
];

// ============================================================
// BUSINESS AREAS
// ============================================================

export const BUSINESS_AREAS: BusinessArea[] = [
  {
    id: 'education',
    name: 'Education',
    emoji: '🎓',
    description: 'Certs y EQ Weeks (UEQ, BPC, EQAC, EQPC, EQPM)',
    is_revenue_generating: true,
    admin_only: false,
    revenue_target_annual: 110_000,
    cost_allocation_annual: 0, // se calcula como % del burn
  },
  {
    id: 'assessments',
    name: 'Assessments',
    emoji: '🧠',
    description: 'Créditos para SEI, LVS, OVS, TVS, Brain Profiles, Insights',
    is_revenue_generating: true,
    admin_only: false,
    revenue_target_annual: 146_000, // target 2026: cubrir el burn solo con créditos
    cost_allocation_annual: 0,
  },
  {
    id: 'eq_biz',
    name: 'EQ Biz',
    emoji: '💼',
    description: 'Consultoría corporativa y facilitación custom',
    is_revenue_generating: true,
    admin_only: false,
    revenue_target_annual: 103_200,
    cost_allocation_annual: 0,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    emoji: '📢',
    description: 'Lead gen, UEQ (lead magnet), ADS, content',
    is_revenue_generating: false, // genera leads, no revenue directo
    admin_only: false,
    revenue_target_annual: 0,
    cost_allocation_annual: 15_000, // ADS budget
  },
  {
    id: 'membership',
    name: 'Membership',
    emoji: '👥',
    description: 'Network membership fees',
    is_revenue_generating: true,
    admin_only: true, // solo Eduardo
    revenue_target_annual: 31_300,
    cost_allocation_annual: 0,
  },
  {
    id: 'impact',
    name: 'Impact',
    emoji: '🌱',
    description: 'EQ Impact Programs, scholarships, donations',
    is_revenue_generating: true,
    admin_only: false,
    revenue_target_annual: 17_900, // $14,900 impact + $3,000 donations
    cost_allocation_annual: 0,
  },
  {
    id: 'operations',
    name: 'Operations',
    emoji: '⚙️',
    description: 'Función de soporte: admin, compliance, inventory',
    is_revenue_generating: false,
    admin_only: false,
    revenue_target_annual: 0,
    cost_allocation_annual: 10_800, // Liliana + Otilia (porcentaje del tiempo)
  },
  {
    id: 'partners',
    name: 'Partners',
    emoji: '🤝',
    description: 'Gestión de relaciones con partners (Talent Advisors et al.)',
    is_revenue_generating: false, // partners contribuyen via Education deals
    admin_only: true, // solo Eduardo
    revenue_target_annual: 0,
    cost_allocation_annual: 0,
  },
  {
    id: 'system',
    name: 'Sistema',
    emoji: '🛡️',
    description: 'Admin: usuarios, permisos, configuración',
    is_revenue_generating: false,
    admin_only: true, // solo Eduardo
    revenue_target_annual: 0,
    cost_allocation_annual: 0,
  },
];

// ============================================================
// AREA PERMISSIONS (who can see what)
// ============================================================

export const AREA_PERMISSIONS: AreaPermission[] = [
  // Eduardo is admin — sees everything implicitly, no entries needed.

  // Natalia: Education lead + Operations collaborator
  { user_id: 'natalia', area_id: 'education', level: 'lead' },
  { user_id: 'natalia', area_id: 'operations', level: 'collaborator' },

  // Karla: Marketing lead
  { user_id: 'karla', area_id: 'marketing', level: 'lead' },

  // Andreia: EQ Biz lead + Assessments viewer (usa créditos en consultoría)
  { user_id: 'andreia', area_id: 'eq_biz', level: 'lead' },
  { user_id: 'andreia', area_id: 'assessments', level: 'viewer' },

  // Liliana: Impact lead + Operations collaborator + Assessments viewer
  { user_id: 'liliana', area_id: 'impact', level: 'lead' },
  { user_id: 'liliana', area_id: 'operations', level: 'collaborator' },
  { user_id: 'liliana', area_id: 'assessments', level: 'viewer' },

  // Otilia: Impact lead + Assessments viewer
  { user_id: 'otilia', area_id: 'impact', level: 'lead' },
  { user_id: 'otilia', area_id: 'assessments', level: 'viewer' },
];

// ============================================================
// PARTNERS (external resellers)
// ============================================================

export const PARTNERS: Partner[] = [
  {
    id: 'talent-advisors',
    name: 'Talent Advisors',
    country: 'PE',
    tier: 'STRATEGIC', // ~30% discount sobre retail confirmado por sus precios actuales
    ytd_pax: 0,
    ytd_revenue: 0,
    ytd_cac_absorbed: 0,
    active_since: '2024-01-01',
    active: true,
  },
  {
    id: 'be2grow',
    name: 'Be2grow',
    country: 'OTHER',
    tier: 'EXPLORER', // tier inicial — sube cuando demuestre volumen
    ytd_pax: 0,
    ytd_revenue: 0,
    ytd_cac_absorbed: 0,
    active_since: '2026-01-01',
    active: true,
  },
  {
    id: 'diversa',
    name: 'Diversa',
    country: 'OTHER',
    tier: 'EXPLORER',
    ytd_pax: 0,
    ytd_revenue: 0,
    ytd_cac_absorbed: 0,
    active_since: '2026-01-01',
    active: true,
  },
  {
    id: 'brain-up',
    name: 'Brain Up',
    country: 'OTHER',
    tier: 'EXPLORER',
    ytd_pax: 0,
    ytd_revenue: 0,
    ytd_cac_absorbed: 0,
    active_since: '2026-01-01',
    active: true,
  },
  {
    id: 'sun-up',
    name: 'Sun Up',
    country: 'OTHER',
    tier: 'EXPLORER',
    ytd_pax: 0,
    ytd_revenue: 0,
    ytd_cac_absorbed: 0,
    active_since: '2026-01-01',
    active: true,
  },
];

// ============================================================
// PARTNER CONTACTS (seed empty — will be populated via invites)
// ============================================================

export const PARTNER_CONTACTS: PartnerContact[] = [];

// ============================================================
// REFERRERS (external referrers)
// ============================================================

export const REFERRERS: Referrer[] = [
  {
    id: 'yisseth',
    name: 'Yisseth',
    email: '', // por completar
    default_commission_pct: 0.10,
    ytd_referred_deals: 0,
    ytd_commission_paid: 0,
    ytd_revenue_generated: 0,
    active: true,
    notes: 'Referenciadora zona Caribe — caso EQ Week Cartagena',
  },
];

// ============================================================
// HELPERS — build visibility context for a given user
// ============================================================

export function buildVisibilityContext(userId: string): VisibilityContext | null {
  const user = USERS.find(u => u.id === userId);
  if (!user) return null;
  const permissions = AREA_PERMISSIONS.filter(p => p.user_id === userId);
  return { current_user: user, permissions };
}

export function getAreaById(areaId: string): BusinessArea | undefined {
  return BUSINESS_AREAS.find(a => a.id === areaId);
}

export function getUserById(userId: string): User | undefined {
  return USERS.find(u => u.id === userId);
}

export function getPartnerById(partnerId: string): Partner | undefined {
  return PARTNERS.find(p => p.id === partnerId);
}

export function getReferrerById(referrerId: string): Referrer | undefined {
  return REFERRERS.find(r => r.id === referrerId);
}

export function getPartnerContacts(partnerId: string): PartnerContact[] {
  return PARTNER_CONTACTS.filter(c => c.partner_id === partnerId);
}
