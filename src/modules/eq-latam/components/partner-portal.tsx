'use client';

import { useMemo, useState } from 'react';
import { FileText, TrendingUp, Users as UsersIcon } from 'lucide-react';
import {
  EQ_WEEK_COST_MODEL,
  FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD,
  PARTNER_COMBINED_DISCOUNT_CAP_PCT,
  formatPriceUSD,
  formatPercent,
  getTierConfig,
  resolveFullEqWeekWholesalePrice,
  volumeBonusForPax,
} from '..';
import type { Partner } from '..';

const PAX_OPTIONS = [3, 5, 10, 15, 20];

/**
 * Partner self-service portal.
 *
 * Audience: external partner contact (Talent Advisors, Be2grow, etc.).
 * They see their tier, their wholesale prices, suggested retail to their
 * client, and their gross margin. They do NOT see 6S Latam's internal
 * costs, distribution, commissions, or other partners.
 */
export function PartnerPortal({ partner }: { partner: Partner }) {
  const [pax, setPax] = useState<number>(15);
  const [clientName, setClientName] = useState<string>('');
  const [retailOverride, setRetailOverride] = useState<number | null>(null);

  const tier = getTierConfig(partner.tier);

  const numbers = useMemo(() => {
    const retailDefault = FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD;
    const retail = retailOverride ?? retailDefault;

    // Wholesale: PDF-defined sliding scale (already incorporates Strategic tier ~30%)
    // For Explorer/Growth/Elite the price scales off the discount table.
    const baseDiscount = tier.discount_pct;
    const volumeBonus = volumeBonusForPax(pax);
    const combinedDiscount = Math.min(
      baseDiscount + volumeBonus,
      PARTNER_COMBINED_DISCOUNT_CAP_PCT,
    );
    const wholesalePerPax =
      partner.tier === 'STRATEGIC'
        ? resolveFullEqWeekWholesalePrice(pax)
        : retail * (1 - combinedDiscount);

    const wholesaleTotal = wholesalePerPax * pax;
    const retailTotal = retail * pax;
    const partnerGross = retailTotal - wholesaleTotal;
    const partnerGrossPct = retailTotal > 0 ? partnerGross / retailTotal : 0;

    return {
      retail,
      retailTotal,
      wholesalePerPax,
      wholesaleTotal,
      partnerGross,
      partnerGrossPct,
      baseDiscount,
      volumeBonus,
      combinedDiscount,
    };
  }, [pax, retailOverride, partner.tier, tier.discount_pct]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-eq-gradient flex items-center justify-center text-white text-sm font-bold">
              EQ
            </div>
            <div>
              <h1 className="font-display font-bold text-eq-navy text-sm">
                Portal Partner · {partner.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                EQ Latam · Six Seconds
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Tu tier</div>
            <div className="font-semibold text-eq-navy">
              {tier.label}{' '}
              <span className="text-xs text-muted-foreground">
                ({tier.description})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Tier info */}
        <div className="bg-eq-cream/40 border rounded-xl p-4 text-sm">
          <div className="flex flex-wrap gap-4">
            <Stat
              label="Tu descuento base"
              value={`−${(tier.discount_pct * 100).toFixed(0)}%`}
            />
            <Stat
              label="Bonus actual (por volumen)"
              value={
                numbers.volumeBonus > 0
                  ? `−${(numbers.volumeBonus * 100).toFixed(0)}%`
                  : '0%'
              }
            />
            <Stat
              label="YTD PAX entregados"
              value={String(partner.ytd_pax)}
            />
            <Stat
              label="YTD Revenue"
              value={formatPriceUSD(partner.ytd_revenue)}
            />
          </div>
        </div>

        {/* Calculator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Inputs */}
          <div className="md:col-span-1 bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Cotizar Full EQ Week</h3>

            <FormField label="Nombre del cliente">
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Cartagena Corp"
                className="w-full text-sm border rounded-lg px-3 py-2"
              />
            </FormField>

            <FormField label="# de participantes">
              <div className="grid grid-cols-5 gap-1">
                {PAX_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setPax(n)}
                    className={`text-sm py-2 rounded-lg border transition-colors ${
                      pax === n
                        ? 'bg-eq-blue text-white border-eq-blue'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Precio retail al cliente (override opcional)">
              <input
                type="number"
                min={0}
                placeholder={`Default: ${FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD}`}
                value={retailOverride ?? ''}
                onChange={e =>
                  setRetailOverride(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                className="w-full text-sm border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Puedes subir el retail si tu mercado lo soporta.
              </p>
            </FormField>
          </div>

          {/* Output */}
          <div className="md:col-span-2 bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Tu propuesta
            </h3>

            <div className="space-y-2 text-sm">
              <Row
                label="Precio al cliente"
                value={`${formatPriceUSD(numbers.retail)} × ${pax} PAX = ${formatPriceUSD(numbers.retailTotal)}`}
              />
              <Row
                label="Tu costo (wholesale 6S Latam)"
                value={`${formatPriceUSD(numbers.wholesalePerPax)} × ${pax} = ${formatPriceUSD(numbers.wholesaleTotal)}`}
                muted
              />
              <Row
                label="Descuento aplicado"
                value={`Tier ${tier.label} (−${(numbers.baseDiscount * 100).toFixed(0)}%) ${
                  numbers.volumeBonus > 0
                    ? `+ Bonus volumen (−${(numbers.volumeBonus * 100).toFixed(0)}%)`
                    : ''
                }`}
                muted
              />
              <div className="border-t pt-2 mt-2">
                <Row
                  label={<strong>Tu margen bruto</strong>}
                  value={
                    <strong className="text-emerald-600">
                      {formatPriceUSD(numbers.partnerGross)} (
                      {formatPercent(numbers.partnerGrossPct)})
                    </strong>
                  }
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  alert(
                    `[Preview] Generando PDF para "${clientName || 'Cliente'}" con ${pax} PAX. La integración real va en próxima iteración.`,
                  )
                }
                className="text-sm py-2 bg-eq-blue text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Generar propuesta PDF
              </button>
              <button
                disabled
                className="text-sm py-2 border rounded-lg text-muted-foreground opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <UsersIcon className="w-4 h-4" /> Comunicar a 6S Latam
              </button>
            </div>
          </div>
        </div>

        {/* Tier progress */}
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2">Progreso de tier</h3>
          <TierProgress partner={partner} />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Precios sugeridos. Eduardo y el equipo 6S Latam pueden aprobar
          ajustes caso por caso.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${
        muted ? 'text-muted-foreground' : ''
      }`}
    >
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-eq-navy text-sm">{value}</div>
    </div>
  );
}

function TierProgress({ partner }: { partner: Partner }) {
  const tierThresholds = [
    { tier: 'EXPLORER', max: 20 },
    { tier: 'GROWTH', max: 50 },
    { tier: 'STRATEGIC', max: 100 },
    { tier: 'ELITE', max: 150 },
  ];
  const currentIdx = tierThresholds.findIndex(t => t.tier === partner.tier);
  const next = tierThresholds[currentIdx + 1];
  const needed = next ? next.max - partner.ytd_pax : 0;
  const progress = next ? Math.min(partner.ytd_pax / next.max, 1) : 1;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>
          {partner.ytd_pax} PAX YTD
          {next && (
            <span className="text-muted-foreground">
              {' '}· Tier siguiente: {next.tier} ({needed} PAX más)
            </span>
          )}
        </span>
        <span className="font-medium">
          {(progress * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-eq-blue h-full rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
