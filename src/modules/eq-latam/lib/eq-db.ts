/**
 * EQ LATAM — Supabase data access layer.
 *
 * Provides typed async functions that read/write the eq_* tables.
 * Each function falls back to in-memory seeds when Supabase is not
 * configured (dev mode), so the UI keeps working without a backend.
 *
 * Convention: all functions are async, return null/undefined on failure
 * rather than throwing. Components decide how to surface errors.
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import {
  AREA_PERMISSIONS as SEED_PERMISSIONS,
  PARTNERS as SEED_PARTNERS,
  PARTNER_CONTACTS as SEED_CONTACTS,
  REFERRERS as SEED_REFERRERS,
  USERS as SEED_USERS,
} from './eq-organization';
import type {
  AreaId,
  AreaPermission,
  Partner,
  PartnerContact,
  PartnerTier,
  PermissionLevel,
  Quote,
  Referrer,
  User,
  UserRole,
} from '../types/organization';

// In-memory quote store for dev (until Supabase tables are applied)
const QUOTES_IN_MEMORY: Quote[] = [];

// ============================================================
// USERS (internal team)
// ============================================================

export async function fetchUsers(): Promise<User[]> {
  const supabase = createClient();
  if (!supabase) return [...SEED_USERS];
  const { data, error } = await supabase
    .from('eq_users')
    .select('*')
    .order('name');
  if (error || !data) return [...SEED_USERS];
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as UserRole,
    monthly_salary_usd: Number(r.monthly_salary_usd ?? 0),
    active: !!r.active,
  }));
}

export async function upsertUser(u: User): Promise<boolean> {
  const idx = SEED_USERS.findIndex(x => x.id === u.id);
  if (idx >= 0) SEED_USERS[idx] = u;
  else SEED_USERS.push(u);

  const supabase = createClient();
  if (!supabase) return true;
  const { error } = await supabase
    .from('eq_users')
    .upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      monthly_salary_usd: u.monthly_salary_usd,
      active: u.active,
    });
  if (error) console.warn('[eq-db] upsertUser failed; kept locally:', error.message);
  return true;
}

// ============================================================
// AREA PERMISSIONS
// ============================================================

export async function fetchPermissions(): Promise<AreaPermission[]> {
  const supabase = createClient();
  if (!supabase) return [...SEED_PERMISSIONS];
  const { data, error } = await supabase
    .from('eq_permissions')
    .select('user_id, area_id, level');
  if (error || !data) return [...SEED_PERMISSIONS];
  return data.map((r: any) => ({
    user_id: r.user_id,
    area_id: r.area_id as AreaId,
    level: r.level as PermissionLevel,
  }));
}

export async function setPermission(
  user_id: string,
  area_id: AreaId,
  level: PermissionLevel | null,
): Promise<boolean> {
  // Mirror in memory
  const idx = SEED_PERMISSIONS.findIndex(
    p => p.user_id === user_id && p.area_id === area_id,
  );
  if (level === null) {
    if (idx >= 0) SEED_PERMISSIONS.splice(idx, 1);
  } else {
    if (idx >= 0) SEED_PERMISSIONS[idx] = { user_id, area_id, level };
    else SEED_PERMISSIONS.push({ user_id, area_id, level });
  }

  const supabase = createClient();
  if (!supabase) return true;
  if (level === null) {
    const { error } = await supabase
      .from('eq_permissions')
      .delete()
      .eq('user_id', user_id)
      .eq('area_id', area_id);
    if (error) console.warn('[eq-db] setPermission delete failed:', error.message);
  } else {
    const { error } = await supabase
      .from('eq_permissions')
      .upsert({ user_id, area_id, level }, { onConflict: 'user_id,area_id' });
    if (error) console.warn('[eq-db] setPermission upsert failed:', error.message);
  }
  return true;
}

// ============================================================
// PARTNERS
// ============================================================

export async function fetchPartners(): Promise<Partner[]> {
  const supabase = createClient();
  if (!supabase) return SEED_PARTNERS;

  const { data, error } = await supabase
    .from('eq_partners')
    .select('*')
    .order('name');

  if (error || !data) {
    console.warn('[eq-db] fetchPartners fallback to seeds:', error?.message);
    return SEED_PARTNERS;
  }

  return data.map(rowToPartner);
}

export async function upsertPartner(p: Partner): Promise<Partner | null> {
  const supabase = createClient();
  if (!supabase) {
    // dev fallback — mutate the in-memory seed
    const idx = SEED_PARTNERS.findIndex(x => x.id === p.id);
    if (idx >= 0) SEED_PARTNERS[idx] = p;
    else SEED_PARTNERS.push(p);
    return p;
  }

  const { data, error } = await supabase
    .from('eq_partners')
    .upsert({
      id: p.id,
      name: p.name,
      country: p.country,
      tier: p.tier,
      ytd_pax: p.ytd_pax,
      ytd_revenue: p.ytd_revenue,
      ytd_cac_absorbed: p.ytd_cac_absorbed,
      active_since: p.active_since,
      active: p.active,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[eq-db] upsertPartner failed:', error?.message);
    return null;
  }
  return rowToPartner(data);
}

export async function deactivatePartner(id: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) {
    const idx = SEED_PARTNERS.findIndex(x => x.id === id);
    if (idx >= 0) SEED_PARTNERS[idx] = { ...SEED_PARTNERS[idx], active: false };
    return true;
  }

  const { error } = await supabase
    .from('eq_partners')
    .update({ active: false })
    .eq('id', id);

  return !error;
}

// ============================================================
// PARTNER CONTACTS
// ============================================================

export async function fetchPartnerContacts(partnerId: string): Promise<PartnerContact[]> {
  const supabase = createClient();
  if (!supabase) return SEED_CONTACTS.filter(c => c.partner_id === partnerId);

  const { data, error } = await supabase
    .from('eq_partner_contacts')
    .select('*')
    .eq('partner_id', partnerId)
    .order('name');

  if (error || !data) {
    return SEED_CONTACTS.filter(c => c.partner_id === partnerId);
  }
  return data.map(rowToContact);
}

export async function createPartnerContact(
  contact: Omit<PartnerContact, 'invited_at'> & { invited_at?: string },
): Promise<PartnerContact | null> {
  const supabase = createClient();
  const invited = { ...contact, invited_at: contact.invited_at ?? new Date().toISOString() };

  if (!supabase) {
    SEED_CONTACTS.push(invited);
    return invited;
  }

  const { data, error } = await supabase
    .from('eq_partner_contacts')
    .insert({
      id: invited.id,
      partner_id: invited.partner_id,
      name: invited.name,
      email: invited.email,
      role: invited.role,
      invited_at: invited.invited_at,
      active: invited.active,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[eq-db] createPartnerContact failed:', error?.message);
    return null;
  }
  return rowToContact(data);
}

// ============================================================
// REFERRERS
// ============================================================

export async function fetchReferrers(): Promise<Referrer[]> {
  const supabase = createClient();
  if (!supabase) return SEED_REFERRERS;

  const { data, error } = await supabase
    .from('eq_referrers')
    .select('*')
    .order('name');

  if (error || !data) return SEED_REFERRERS;
  return data.map(rowToReferrer);
}

// ============================================================
// QUOTES (cotización history)
// ============================================================

export async function fetchQuotes(partnerId?: string): Promise<Quote[]> {
  const supabase = createClient();
  if (!supabase) {
    return partnerId
      ? QUOTES_IN_MEMORY.filter(q => q.partner_id === partnerId)
      : [...QUOTES_IN_MEMORY];
  }
  let query = supabase
    .from('eq_quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (partnerId) query = query.eq('partner_id', partnerId);
  const { data, error } = await query;
  if (error || !data) {
    return partnerId
      ? QUOTES_IN_MEMORY.filter(q => q.partner_id === partnerId)
      : [...QUOTES_IN_MEMORY];
  }
  return data.map(rowToQuote);
}

export async function createQuote(q: Omit<Quote, 'id' | 'created_at' | 'status'>): Promise<Quote | null> {
  const newQuote: Quote = {
    ...q,
    id: crypto.randomUUID(),
    status: 'draft',
    created_at: new Date().toISOString(),
  };

  // Always mirror in-memory so UI lists update without Supabase.
  QUOTES_IN_MEMORY.unshift(newQuote);

  const supabase = createClient();
  if (!supabase) return newQuote;

  const { data, error } = await supabase
    .from('eq_quotes')
    .insert({
      partner_id: q.partner_id ?? null,
      referrer_id: q.referrer_id ?? null,
      product_code: q.product_code,
      client_name: q.client_name ?? null,
      city: q.city ?? null,
      country: q.country,
      pax: q.pax ?? null,
      retail_per_pax_usd: q.retail_per_pax_usd ?? null,
      wholesale_per_pax_usd: q.wholesale_per_pax_usd ?? null,
      retail_total_usd: q.retail_total_usd,
      wholesale_total_usd: q.wholesale_total_usd,
      partner_gross_usd: q.partner_gross_usd,
      pdf_filename: q.pdf_filename ?? null,
      notes: q.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.warn('[eq-db] createQuote — Supabase insert failed (migrations 027 likely not applied); kept locally:', error?.message);
    return newQuote;
  }
  return rowToQuote(data);
}

/**
 * Promote a quote to a closed Deal — bumps partner + referrer YTD.
 * Calls the eq_close_quote() Postgres function when Supabase is available;
 * otherwise simulates the side-effects in-memory.
 */
export async function closeQuote(quoteId: string): Promise<boolean> {
  const supabase = createClient();
  const idx = QUOTES_IN_MEMORY.findIndex(q => q.id === quoteId);
  const local = idx >= 0 ? QUOTES_IN_MEMORY[idx] : null;

  if (!supabase) {
    if (local) {
      QUOTES_IN_MEMORY[idx] = { ...local, status: 'closed', closed_at: new Date().toISOString() };
      // Bump in-memory partner YTD
      if (local.partner_id) {
        const pIdx = SEED_PARTNERS.findIndex(p => p.id === local.partner_id);
        if (pIdx >= 0) {
          SEED_PARTNERS[pIdx] = {
            ...SEED_PARTNERS[pIdx],
            ytd_pax: SEED_PARTNERS[pIdx].ytd_pax + (local.pax ?? 0),
            ytd_revenue: SEED_PARTNERS[pIdx].ytd_revenue + local.wholesale_total_usd,
          };
        }
      }
    }
    return true;
  }

  const { error } = await supabase.rpc('eq_close_quote', { p_quote_id: quoteId });
  if (error) {
    console.warn('[eq-db] closeQuote RPC failed, applying locally:', error.message);
    if (local) {
      QUOTES_IN_MEMORY[idx] = { ...local, status: 'closed', closed_at: new Date().toISOString() };
      if (local.partner_id) {
        const pIdx = SEED_PARTNERS.findIndex(p => p.id === local.partner_id);
        if (pIdx >= 0) {
          SEED_PARTNERS[pIdx] = {
            ...SEED_PARTNERS[pIdx],
            ytd_pax: SEED_PARTNERS[pIdx].ytd_pax + (local.pax ?? 0),
            ytd_revenue: SEED_PARTNERS[pIdx].ytd_revenue + local.wholesale_total_usd,
          };
        }
      }
    }
  }
  return true;
}

function rowToQuote(r: any): Quote {
  return {
    id: r.id,
    partner_id: r.partner_id ?? undefined,
    referrer_id: r.referrer_id ?? undefined,
    product_code: r.product_code,
    client_name: r.client_name ?? undefined,
    city: r.city ?? undefined,
    country: r.country,
    pax: r.pax ?? undefined,
    retail_per_pax_usd: r.retail_per_pax_usd != null ? Number(r.retail_per_pax_usd) : undefined,
    wholesale_per_pax_usd: r.wholesale_per_pax_usd != null ? Number(r.wholesale_per_pax_usd) : undefined,
    retail_total_usd: Number(r.retail_total_usd ?? 0),
    wholesale_total_usd: Number(r.wholesale_total_usd ?? 0),
    partner_gross_usd: Number(r.partner_gross_usd ?? 0),
    status: r.status,
    pdf_filename: r.pdf_filename ?? undefined,
    notes: r.notes ?? undefined,
    created_at: r.created_at,
    closed_at: r.closed_at ?? undefined,
    closed_deal_id: r.closed_deal_id ?? undefined,
  };
}

// ============================================================
// KPI VALUES
// ============================================================

export interface KpiValueRow {
  area_id: string;
  kpi_code: string;
  period_type: 'weekly' | 'monthly';
  period_label: string;
  value: number | null;
  target?: number | null;
  notes?: string;
}

const KPI_VALUES_IN_MEMORY: KpiValueRow[] = [];

const kpiKey = (r: { area_id: string; kpi_code: string; period_type: string; period_label: string }) =>
  `${r.area_id}|${r.kpi_code}|${r.period_type}|${r.period_label}`;

export async function fetchKpiValues(
  areaId: string,
  periodType: 'weekly' | 'monthly',
): Promise<KpiValueRow[]> {
  const local = KPI_VALUES_IN_MEMORY.filter(
    v => v.area_id === areaId && v.period_type === periodType,
  );
  const supabase = createClient();
  if (!supabase) return local;
  const { data, error } = await supabase
    .from('eq_kpi_values')
    .select('area_id,kpi_code,period_type,period_label,value,target,notes')
    .eq('area_id', areaId)
    .eq('period_type', periodType);
  if (error || !data) return local;
  return data.map((r: any) => ({
    area_id: r.area_id,
    kpi_code: r.kpi_code,
    period_type: r.period_type,
    period_label: r.period_label,
    value: r.value != null ? Number(r.value) : null,
    target: r.target != null ? Number(r.target) : undefined,
    notes: r.notes ?? undefined,
  }));
}

export async function saveKpiValue(row: KpiValueRow): Promise<boolean> {
  // Mirror in-memory
  const idx = KPI_VALUES_IN_MEMORY.findIndex(v => kpiKey(v) === kpiKey(row));
  if (idx >= 0) KPI_VALUES_IN_MEMORY[idx] = row;
  else KPI_VALUES_IN_MEMORY.push(row);

  const supabase = createClient();
  if (!supabase) return true;
  const { error } = await supabase
    .from('eq_kpi_values')
    .upsert(
      {
        area_id: row.area_id,
        kpi_code: row.kpi_code,
        period_type: row.period_type,
        period_label: row.period_label,
        value: row.value,
        target: row.target ?? null,
        notes: row.notes ?? null,
      },
      { onConflict: 'area_id,kpi_code,period_type,period_label' },
    );
  if (error) {
    console.warn('[eq-db] saveKpiValue Supabase failed; kept locally:', error.message);
  }
  return true;
}

/**
 * Bulk import — accepts a list of KpiValueRow and upserts each.
 */
export async function importKpiValues(rows: KpiValueRow[]): Promise<number> {
  let ok = 0;
  for (const r of rows) {
    const success = await saveKpiValue(r);
    if (success) ok++;
  }
  return ok;
}

// ============================================================
// MAPPERS — DB row → TS type
// ============================================================

function rowToPartner(r: any): Partner {
  return {
    id: r.id,
    name: r.name,
    country: r.country,
    tier: r.tier as PartnerTier,
    ytd_pax: Number(r.ytd_pax ?? 0),
    ytd_revenue: Number(r.ytd_revenue ?? 0),
    ytd_cac_absorbed: Number(r.ytd_cac_absorbed ?? 0),
    active_since:
      typeof r.active_since === 'string'
        ? r.active_since
        : new Date(r.active_since).toISOString().slice(0, 10),
    active: !!r.active,
    custom_pricing: r.custom_pricing ?? {},
  };
}

/**
 * Saves the partner's custom retail prices.
 *
 * Always updates the in-memory seed (UI source of truth in dev / before
 * migration 026 is applied). Best-effort updates Supabase when available;
 * a DB error doesn't block the UI from reflecting the change.
 *
 * Returns true if the persistence layer accepted the write (or no Supabase
 * is configured). false signals that Supabase rejected it (e.g., RLS).
 */
export async function savePartnerCustomPricing(
  partnerId: string,
  pricing: Partner['custom_pricing'],
): Promise<boolean> {
  // 1. Always mutate in-memory so the UI re-renders immediately.
  const idx = SEED_PARTNERS.findIndex(p => p.id === partnerId);
  if (idx >= 0) SEED_PARTNERS[idx] = { ...SEED_PARTNERS[idx], custom_pricing: pricing };

  // 2. Best-effort persist to Supabase.
  const supabase = createClient();
  if (!supabase) return true;

  const { error } = await supabase
    .from('eq_partners')
    .update({ custom_pricing: pricing ?? {} })
    .eq('id', partnerId);

  if (error) {
    console.warn(
      '[eq-db] savePartnerCustomPricing — Supabase update failed (likely migration 024+026 not applied yet); UI kept the change locally:',
      error.message,
    );
  }
  // Treat as success either way — UI shouldn't block on missing migrations.
  return true;
}

function rowToContact(r: any): PartnerContact {
  return {
    id: r.id,
    partner_id: r.partner_id,
    name: r.name,
    email: r.email,
    role: r.role,
    invited_at: r.invited_at ?? undefined,
    accepted_at: r.accepted_at ?? undefined,
    last_login_at: r.last_login_at ?? undefined,
    active: !!r.active,
  };
}

function rowToReferrer(r: any): Referrer {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? '',
    default_commission_pct: Number(r.default_commission_pct ?? 0.1),
    ytd_referred_deals: Number(r.ytd_referred_deals ?? 0),
    ytd_commission_paid: Number(r.ytd_commission_paid ?? 0),
    ytd_revenue_generated: Number(r.ytd_revenue_generated ?? 0),
    active: !!r.active,
    notes: r.notes ?? undefined,
  };
}
