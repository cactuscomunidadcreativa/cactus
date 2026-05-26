/**
 * EQ LATAM — Cost Catalog (hours × hourly rates by modality).
 *
 * Source: Master Cert Costos.xlsx + Eduardo's restructure 2026.
 *
 * Cost rules:
 *   1. NO 1:1 sessions. All Acompañamiento/Mentoría hours = 0.
 *   2. Group online sessions: $50/hr flat (standard).
 *   3. Full EQ Week presencial: $5,000 flat (5 días × $1,000). See EQ_WEEK_COST_MODEL.
 *   4. Standalone presencial certs: legacy flat fees retained for reference.
 *   5. Materials kit: $35/PAX.
 *   6. Merch: $90/PAX cost — ONLY when bundle includes EQPC AND EQPM (Full EQ Week).
 *   7. Credits cost = $0 (covered by $40k annual maintenance to 6S Global).
 */

import type { CertificationId, PackId, Modality, TrainerRole } from '../types';

// ============================================================
// HOURLY RATES (per Eduardo's restructure)
// ============================================================

export const HOURLY_RATE_GROUP_DEFAULT_USD = 50;

// ============================================================
// CERT HOURS BY MODALITY (from Master Cert Costos)
// ============================================================

export interface CertHours {
  certId: CertificationId;
  modality: Modality;
  trainerRole?: TrainerRole;
  facilitation_hours: number;
  acompanamiento_hours: 0; // eliminated
  mentoria_hours: 0;       // eliminated
  /** For presencial modalities, this is the flat facilitation fee. */
  presencial_flat_usd?: number;
}

/**
 * Hours per cert per modality.
 * Acompañamiento and Mentoría intentionally hard-zeroed (no 1:1).
 */
export const CERT_HOURS_CATALOG: CertHours[] = [
  // ===== Online Grupal (default modality 2026) =====
  { certId: 'UEQ',  modality: 'group_online', facilitation_hours: 3, acompanamiento_hours: 0, mentoria_hours: 0 },
  { certId: 'BPC',  modality: 'group_online', facilitation_hours: 5, acompanamiento_hours: 0, mentoria_hours: 0 },
  { certId: 'EQAC', modality: 'group_online', facilitation_hours: 6, acompanamiento_hours: 0, mentoria_hours: 0 },
  { certId: 'EQPC', modality: 'group_online', facilitation_hours: 6, acompanamiento_hours: 0, mentoria_hours: 0 },
  { certId: 'EQPM', modality: 'group_online', facilitation_hours: 2, acompanamiento_hours: 0, mentoria_hours: 0 },

  // ===== Presencial MT (Master Trainer) — legacy flat fees =====
  { certId: 'UEQ',  modality: 'in_person_mt', trainerRole: 'MT', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
  { certId: 'BPC',  modality: 'in_person_mt', trainerRole: 'MT', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 3000 },
  { certId: 'EQAC', modality: 'in_person_mt', trainerRole: 'MT', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
  { certId: 'EQPC', modality: 'in_person_mt', trainerRole: 'MT', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
  { certId: 'EQPM', modality: 'in_person_mt', trainerRole: 'MT', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },

  // ===== Presencial RF (Regional Facilitator) — legacy flat fees =====
  { certId: 'UEQ',  modality: 'in_person_rf', trainerRole: 'RF', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 1500 },
  { certId: 'BPC',  modality: 'in_person_rf', trainerRole: 'RF', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 1800 },
  { certId: 'EQAC', modality: 'in_person_rf', trainerRole: 'RF', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
  { certId: 'EQPC', modality: 'in_person_rf', trainerRole: 'RF', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
  { certId: 'EQPM', modality: 'in_person_rf', trainerRole: 'RF', facilitation_hours: 0, acompanamiento_hours: 0, mentoria_hours: 0, presencial_flat_usd: 2000 },
];

// ============================================================
// PACK HOURS BY MODALITY
// ============================================================

export interface PackHours {
  packId: PackId;
  modality: Modality;
  total_facilitation_hours: number;
}

/**
 * Online grupal pack hours = sum of constituent cert hours.
 * (Bundle discount realized through shared facilitation slots in practice.)
 */
export const PACK_HOURS_CATALOG: PackHours[] = [
  { packId: 'UEQ_BPC',           modality: 'group_online', total_facilitation_hours: 8 },   // 3 + 5
  { packId: 'UEQ_EQAC',          modality: 'group_online', total_facilitation_hours: 9 },   // 3 + 6
  { packId: 'BPC_EQPM',          modality: 'group_online', total_facilitation_hours: 7 },   // 5 + 2
  { packId: 'UEQ_BPC_EQAC',      modality: 'group_online', total_facilitation_hours: 14 },  // 3 + 5 + 6
  { packId: 'UEQ_BPC_EQAC_EQPC', modality: 'group_online', total_facilitation_hours: 20 },  // 3 + 5 + 6 + 6
  { packId: 'FULL_5',            modality: 'group_online', total_facilitation_hours: 22 },  // 3 + 5 + 6 + 6 + 2
  { packId: 'EQPC_EQPM',         modality: 'group_online', total_facilitation_hours: 8 },   // 6 + 2
];

// ============================================================
// HELPERS
// ============================================================

export function getCertHours(
  certId: CertificationId,
  modality: Modality,
): CertHours | undefined {
  return CERT_HOURS_CATALOG.find(
    h => h.certId === certId && h.modality === modality,
  );
}

export function getPackHours(
  packId: PackId,
  modality: Modality,
): PackHours | undefined {
  return PACK_HOURS_CATALOG.find(
    h => h.packId === packId && h.modality === modality,
  );
}

/**
 * Computes the facilitation cost for a cert in a given modality.
 * - Group online: hours × $50/hr.
 * - Presencial: returns the flat fee.
 * - On-demand (1:1): returns 0 (deprecated, see EQ Latam Operating Spec).
 */
export function calcCertFacilitationCost(
  certId: CertificationId,
  modality: Modality,
): number {
  const hours = getCertHours(certId, modality);
  if (!hours) return 0;
  if (hours.presencial_flat_usd != null) return hours.presencial_flat_usd;
  return hours.facilitation_hours * HOURLY_RATE_GROUP_DEFAULT_USD;
}

/**
 * Returns true if the bundle includes both EQPC AND EQPM (which triggers
 * the merch allocation — only Full EQ Week qualifies).
 */
export function bundleIncludesMerch(certIds: CertificationId[]): boolean {
  return certIds.includes('EQPC') && certIds.includes('EQPM');
}
