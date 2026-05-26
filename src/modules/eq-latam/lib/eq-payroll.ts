/**
 * Six Seconds Latam — Payroll calculation engine.
 *
 * Given a period (YYYY-MM) and the list of closed deals, builds the
 * payout list per recipient with: base salary (team only) + commissions
 * from deals closed in the period.
 *
 * Commission rules (matches DISTRIBUTION_STRUCTURE in eq-data.ts):
 *   - Karla 3% on every deal with marketing_origin
 *   - Closer 5% (or 7% override) on every deal
 *   - Eduardo 10% Director — accounting (already in $1,500 retainer per spec)
 *     We DON'T include it as a line here because it's covered by the retainer.
 *   - Referrer 10% on referrer deals
 */

import { USERS } from './eq-organization';
import { DISTRIBUTION_STRUCTURE } from './eq-data';
import type { Quote } from '../types/organization';

export type PayrollCategory =
  | 'base_salary'
  | 'karla_marketing_commission'
  | 'closer_commission'
  | 'director_commission'
  | 'referrer_commission';

export interface PayrollLine {
  id: string;                       // synthetic, period+recipient+category
  period: string;                   // 'YYYY-MM'
  recipient_kind: 'user' | 'referrer';
  recipient_id: string;
  recipient_name: string;
  category: PayrollCategory;
  category_label: string;
  amount_usd: number;
  source_quote_ids?: string[];
  status: 'pending' | 'paid' | 'cancelled';
}

const CATEGORY_LABELS: Record<PayrollCategory, string> = {
  base_salary: 'Sueldo base',
  karla_marketing_commission: 'Comisión MKT 3%',
  closer_commission: 'Comisión closer',
  director_commission: 'Comisión director 10%',
  referrer_commission: 'Comisión referenciador',
};

/**
 * Returns YYYY-MM for the given Date.
 */
export function formatPeriod(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function inPeriod(quoteCreatedAt: string, period: string): boolean {
  return quoteCreatedAt.startsWith(period);
}

/**
 * Builds the payroll for the given period.
 *
 * @param period   YYYY-MM
 * @param quotes   Closed quotes contributing commissions
 * @param paidStatus Optional map of synthetic line id → status; lines without
 *                   an entry default to 'pending'.
 */
export function calcPayrollForPeriod(
  period: string,
  closedQuotes: Quote[],
  paidStatus: Record<string, 'paid' | 'pending' | 'cancelled'> = {},
): PayrollLine[] {
  const lines: PayrollLine[] = [];

  // ===== Base salaries for ACTIVE internal team =====
  for (const u of USERS) {
    if (!u.active || u.monthly_salary_usd <= 0) continue;
    const id = `${period}-${u.id}-base_salary`;
    lines.push({
      id,
      period,
      recipient_kind: 'user',
      recipient_id: u.id,
      recipient_name: u.name,
      category: 'base_salary',
      category_label: CATEGORY_LABELS.base_salary,
      amount_usd: u.monthly_salary_usd,
      status: paidStatus[id] ?? 'pending',
    });
  }

  // Only closed deals in the period contribute commissions.
  const periodQuotes = closedQuotes.filter(
    q => q.status === 'closed' && inPeriod(q.created_at, period),
  );

  // ===== Karla 3% — aggregate across all marketing-origin deals =====
  // For simplicity we treat every closed deal as marketing-origin (which matches
  // current portal flow where partners cotize independently of the inbound funnel).
  // When real attribution is wired we'll filter by marketing_origin flag.
  const karlaTotal = periodQuotes.reduce(
    (sum, q) => sum + q.retail_total_usd * DISTRIBUTION_STRUCTURE.karlaMarketing,
    0,
  );
  if (karlaTotal > 0) {
    const id = `${period}-karla-karla_marketing_commission`;
    lines.push({
      id,
      period,
      recipient_kind: 'user',
      recipient_id: 'karla',
      recipient_name: 'Karla Parra',
      category: 'karla_marketing_commission',
      category_label: CATEGORY_LABELS.karla_marketing_commission,
      amount_usd: karlaTotal,
      source_quote_ids: periodQuotes.map(q => q.id),
      status: paidStatus[id] ?? 'pending',
    });
  }

  // ===== Closer commission 5% — Eduardo is default closer until comercial hire =====
  // When eq_deals exposes closer_user_id we'll group by it. For now,
  // Eduardo is the closer of every Full EQ Week deal.
  const closerTotal = periodQuotes.reduce(
    (sum, q) => sum + q.retail_total_usd * DISTRIBUTION_STRUCTURE.closerDefault,
    0,
  );
  if (closerTotal > 0) {
    const id = `${period}-eduardo-closer_commission`;
    lines.push({
      id,
      period,
      recipient_kind: 'user',
      recipient_id: 'eduardo',
      recipient_name: 'Eduardo González',
      category: 'closer_commission',
      category_label: CATEGORY_LABELS.closer_commission,
      amount_usd: closerTotal,
      source_quote_ids: periodQuotes.map(q => q.id),
      status: paidStatus[id] ?? 'pending',
    });
  }

  // ===== Referrer 10% — Yisseth gets paid only for her referred deals =====
  const referrerByPartner = new Map<string, { total: number; quoteIds: string[]; name: string }>();
  for (const q of periodQuotes) {
    if (!q.referrer_id) continue;
    const entry = referrerByPartner.get(q.referrer_id) ?? {
      total: 0,
      quoteIds: [],
      name: q.referrer_id,
    };
    entry.total += q.retail_total_usd * DISTRIBUTION_STRUCTURE.referrerDefault;
    entry.quoteIds.push(q.id);
    referrerByPartner.set(q.referrer_id, entry);
  }
  referrerByPartner.forEach((value, referrerId) => {
    if (value.total <= 0) return;
    const id = `${period}-${referrerId}-referrer_commission`;
    lines.push({
      id,
      period,
      recipient_kind: 'referrer',
      recipient_id: referrerId,
      recipient_name: referrerId,
      category: 'referrer_commission',
      category_label: CATEGORY_LABELS.referrer_commission,
      amount_usd: value.total,
      source_quote_ids: value.quoteIds,
      status: paidStatus[id] ?? 'pending',
    });
  });

  return lines.sort((a, b) => {
    // Sort: base salary first, then commissions, by recipient name
    if (a.category === 'base_salary' && b.category !== 'base_salary') return -1;
    if (a.category !== 'base_salary' && b.category === 'base_salary') return 1;
    return a.recipient_name.localeCompare(b.recipient_name);
  });
}

/**
 * Sums totals by status for the given lines.
 */
export function payrollTotals(lines: PayrollLine[]): {
  totalDue: number;
  totalPending: number;
  totalPaid: number;
} {
  const totalDue = lines.reduce((s, l) => s + l.amount_usd, 0);
  const totalPending = lines
    .filter(l => l.status === 'pending')
    .reduce((s, l) => s + l.amount_usd, 0);
  const totalPaid = lines
    .filter(l => l.status === 'paid')
    .reduce((s, l) => s + l.amount_usd, 0);
  return { totalDue, totalPending, totalPaid };
}

/**
 * Lists the last N periods (YYYY-MM) for the period selector.
 */
export function listRecentPeriods(n: number = 6): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(formatPeriod(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
