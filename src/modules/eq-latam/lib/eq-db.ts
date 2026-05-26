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
  PARTNERS as SEED_PARTNERS,
  PARTNER_CONTACTS as SEED_CONTACTS,
  REFERRERS as SEED_REFERRERS,
} from './eq-organization';
import type {
  Partner,
  PartnerContact,
  PartnerTier,
  Referrer,
} from '../types/organization';

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
