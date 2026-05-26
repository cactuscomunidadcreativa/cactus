'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { generatePartnerProposalPDF } from '../lib/eq-pdf';
import { TAX_RATES, getTaxRate, applyTax, type TaxCountry } from '../lib/eq-tax';
import { ServicesCatalogView } from './services-catalog-view';
import { savePartnerCustomPricing, createQuote, closeQuote, fetchQuotes } from '../lib/eq-db';
import { Save, Check, CheckCircle, Clock } from 'lucide-react';
import type { Quote } from '../types/organization';

const PAX_OPTIONS = [3, 5, 10, 15, 20];
type PortalTab = 'eq_week' | 'services' | 'my_prices' | 'history';

/**
 * Partner self-service portal.
 *
 * Audience: external partner contact (Talent Advisors, Be2grow, etc.).
 * They see their tier, their wholesale prices, suggested retail to their
 * client, and their gross margin. They do NOT see 6S Latam's internal
 * costs, distribution, commissions, or other partners.
 */
export function PartnerPortal({ partner: initialPartner }: { partner: Partner }) {
  // Hold partner in local state so MyPricesPanel saves trigger a re-render
  // of the cotizador with the new defaults.
  const [partner, setPartner] = useState<Partner>(initialPartner);
  const [pax, setPax] = useState<number>(15);
  const [clientName, setClientName] = useState<string>('');
  const [retailOverride, setRetailOverride] = useState<number | null>(null);
  const [taxCountry, setTaxCountry] = useState<TaxCountry>(partner.country);
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<PortalTab>('eq_week');

  /**
   * Partner's saved Full EQ Week retail (pre-populates the cotizador).
   * Falls back to platform default if the partner hasn't customized.
   */
  const savedEqWeekRetail =
    partner.custom_pricing?.full_eq_week_retail_per_pax_usd ??
    FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD;

  const tier = getTierConfig(partner.tier);

  const numbers = useMemo(() => {
    const retail = retailOverride ?? savedEqWeekRetail;

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
  }, [pax, retailOverride, savedEqWeekRetail, partner.tier, tier.discount_pct]);

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
        {/* Tab switcher */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {[
            { id: 'eq_week' as const, label: 'Full EQ Week' },
            { id: 'services' as const, label: 'Servicios complementarios' },
            { id: 'my_prices' as const, label: 'Mis precios' },
            { id: 'history' as const, label: 'Historial' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`text-sm px-4 py-2 border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-eq-blue text-eq-blue font-medium'
                  : 'border-transparent text-muted-foreground hover:text-eq-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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
                activeTab === 'eq_week' && numbers.volumeBonus > 0
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

        {/* Services tab */}
        {activeTab === 'services' && <ServicesCatalogView partner={partner} />}

        {/* My prices tab */}
        {activeTab === 'my_prices' && (
          <MyPricesPanel partner={partner} onSaved={setPartner} />
        )}

        {/* History tab */}
        {activeTab === 'history' && <QuoteHistoryPanel partner={partner} />}

        {/* Full EQ Week calculator */}
        {activeTab === 'eq_week' && (
        <>
        {/* (calculator content below) */}

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
              <div className="space-y-1.5">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={pax}
                  onChange={e =>
                    setPax(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                  }
                  className="w-full text-sm border rounded-lg px-3 py-2 text-center font-medium"
                />
                <div className="grid grid-cols-5 gap-1">
                  {PAX_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={() => setPax(n)}
                      className={`text-xs py-1.5 rounded border transition-colors ${
                        pax === n
                          ? 'bg-eq-blue text-white border-eq-blue'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </FormField>

            <FormField label="Precio retail al cliente (override opcional)">
              <input
                type="number"
                min={0}
                placeholder={`Tu precio guardado: ${savedEqWeekRetail}`}
                value={retailOverride ?? ''}
                onChange={e =>
                  setRetailOverride(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                className="w-full text-sm border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {partner.custom_pricing?.full_eq_week_retail_per_pax_usd
                  ? `Estás usando tu precio guardado de ${formatPriceUSD(savedEqWeekRetail)}. Cámbialo en "Mis precios".`
                  : 'Puedes guardar tu precio default en "Mis precios" para no escribirlo cada vez.'}
              </p>
            </FormField>

            <FormField label="País de factura (IVA/IGV)">
              <select
                value={taxCountry}
                onChange={e => setTaxCountry(e.target.value as TaxCountry)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
              >
                {TAX_RATES.map(r => (
                  <option key={r.country} value={r.country}>
                    {r.label} {r.rate > 0 && `· ${r.short} ${(r.rate * 100).toFixed(0)}%`}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 mt-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={e => setIncludeTax(e.target.checked)}
                />
                Mostrar precio con impuesto incluido en propuesta
              </label>
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
              {includeTax && getTaxRate(taxCountry).rate > 0 && (
                <div className="border-t pt-2 mt-2 text-xs">
                  {(() => {
                    const t = applyTax(numbers.retailTotal, taxCountry);
                    const r = getTaxRate(taxCountry);
                    return (
                      <>
                        <Row
                          label={`+ ${r.short} ${(r.rate * 100).toFixed(0)}% (${r.label.replace(/^\S+\s/, '')})`}
                          value={formatPriceUSD(t.tax)}
                          muted
                        />
                        <Row
                          label={<strong>Total al cliente con {r.short}</strong>}
                          value={<strong>{formatPriceUSD(t.total)}</strong>}
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  generatePartnerProposalPDF({
                    partnerName: partner.name,
                    partnerTierLabel: tier.label,
                    clientName,
                    pax,
                    retailPerPax: numbers.retail,
                    wholesalePerPax: numbers.wholesalePerPax,
                    retailTotal: numbers.retailTotal,
                    wholesaleTotal: numbers.wholesaleTotal,
                    partnerGross: numbers.partnerGross,
                    partnerGrossPct: numbers.partnerGrossPct,
                  });
                  // Persist quote
                  await createQuote({
                    partner_id: partner.id,
                    product_code: 'FULL_EQ_WEEK',
                    client_name: clientName || undefined,
                    country: partner.country,
                    pax,
                    retail_per_pax_usd: numbers.retail,
                    wholesale_per_pax_usd: numbers.wholesalePerPax,
                    retail_total_usd: numbers.retailTotal,
                    wholesale_total_usd: numbers.wholesaleTotal,
                    partner_gross_usd: numbers.partnerGross,
                  });
                }}
                className="text-sm py-2 bg-eq-blue text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Generar propuesta PDF
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`¿Confirmar deal cerrado con ${clientName || 'cliente'} (${pax} PAX × ${formatPriceUSD(numbers.retail)})?\n\nEsto suma ${pax} al YTD PAX y ${formatPriceUSD(numbers.wholesaleTotal)} al YTD Revenue del partner.`)) return;
                  const q = await createQuote({
                    partner_id: partner.id,
                    product_code: 'FULL_EQ_WEEK',
                    client_name: clientName || undefined,
                    country: partner.country,
                    pax,
                    retail_per_pax_usd: numbers.retail,
                    wholesale_per_pax_usd: numbers.wholesalePerPax,
                    retail_total_usd: numbers.retailTotal,
                    wholesale_total_usd: numbers.wholesaleTotal,
                    partner_gross_usd: numbers.partnerGross,
                  });
                  if (q) await closeQuote(q.id);
                  // Bump partner YTD locally to re-render dashboard immediately
                  setPartner(p => ({
                    ...p,
                    ytd_pax: p.ytd_pax + pax,
                    ytd_revenue: p.ytd_revenue + numbers.wholesaleTotal,
                  }));
                }}
                className="text-sm py-2 bg-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Marcar deal cerrado
              </button>
            </div>
          </div>
        </div>

        </>
        )}

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

// ============================================================
// MyPricesPanel — partner saves their own retail prices
// ============================================================
// ============================================================
// QuoteHistoryPanel — list of cotizaciones for this partner
// ============================================================
function QuoteHistoryPanel({ partner }: { partner: Partner }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchQuotes(partner.id).then(rows => {
      if (!cancelled) {
        setQuotes(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [partner.id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-sm text-muted-foreground">
        Cargando historial…
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Sin historial todavía</p>
        <p className="text-xs text-muted-foreground mt-1">
          Genera tu primera propuesta PDF en el tab "Full EQ Week" y aparecerá aquí.
        </p>
      </div>
    );
  }

  const statusBadge = (s: Quote['status']) => {
    const cls = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      closed: 'bg-emerald-100 text-emerald-700',
      lost: 'bg-red-100 text-red-700',
    }[s];
    const label = { draft: 'Borrador', sent: 'Enviada', closed: 'Cerrada', lost: 'Perdida' }[s];
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
    );
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Historial de cotizaciones</h3>
        <p className="text-xs text-muted-foreground">
          {quotes.length} cotizaciones · {quotes.filter(q => q.status === 'closed').length} cerradas
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Cliente</th>
            <th className="text-left px-4 py-2 font-medium">Producto</th>
            <th className="text-right px-4 py-2 font-medium">PAX</th>
            <th className="text-right px-4 py-2 font-medium">Revenue (a 6S Latam)</th>
            <th className="text-right px-4 py-2 font-medium">Margen partner</th>
            <th className="text-center px-4 py-2 font-medium">Estado</th>
            <th className="text-right px-4 py-2 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map(q => (
            <tr key={q.id} className="border-t">
              <td className="px-4 py-2 font-medium">{q.client_name || '—'}</td>
              <td className="px-4 py-2 text-xs text-muted-foreground">{q.product_code}</td>
              <td className="px-4 py-2 text-right">{q.pax ?? '—'}</td>
              <td className="px-4 py-2 text-right">{formatPriceUSD(q.wholesale_total_usd)}</td>
              <td className="px-4 py-2 text-right text-emerald-600">{formatPriceUSD(q.partner_gross_usd)}</td>
              <td className="px-4 py-2 text-center">{statusBadge(q.status)}</td>
              <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                {new Date(q.created_at).toLocaleDateString('es')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyPricesPanel({
  partner,
  onSaved,
}: {
  partner: Partner;
  onSaved: (next: Partner) => void;
}) {
  const initial = partner.custom_pricing ?? {};
  const [eqWeekRetail, setEqWeekRetail] = useState<string>(
    initial.full_eq_week_retail_per_pax_usd != null
      ? String(initial.full_eq_week_retail_per_pax_usd)
      : '',
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const persist = async (pricing: Partner['custom_pricing']) => {
    setSaving(true);
    const ok = await savePartnerCustomPricing(partner.id, pricing);
    if (ok) {
      const updated = { ...partner, custom_pricing: pricing };
      onSaved(updated);
      setSavedAt(new Date());
    }
    setSaving(false);
  };

  const handleSave = () =>
    persist({
      ...initial,
      full_eq_week_retail_per_pax_usd:
        eqWeekRetail === '' ? undefined : Number(eqWeekRetail),
    });

  const handleClear = () => {
    setEqWeekRetail('');
    return persist({ ...initial, full_eq_week_retail_per_pax_usd: undefined });
  };

  return (
    <div className="space-y-4">
      <div className="bg-eq-cream/40 border rounded-xl p-4 text-sm">
        <div className="font-semibold mb-1">Tus precios guardados</div>
        <p className="text-xs text-muted-foreground">
          Aquí defines tu precio retail por defecto para que no lo escribas en
          cada cotización. Tu wholesale lo calcula el sistema con tu descuento de
          tier {partner.tier}.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3">Full EQ Week</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground block mb-1">
              Tu precio retail por participante (USD)
            </label>
            <input
              type="number"
              min={0}
              placeholder={`Default platform: ${FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD}`}
              value={eqWeekRetail}
              onChange={e => setEqWeekRetail(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mercado típico Latam: $2,500–$3,500/PAX.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-2 bg-eq-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              {savedAt && !saving ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Guardando…' : savedAt ? 'Guardado' : 'Guardar'}
            </button>
            {initial.full_eq_week_retail_per_pax_usd != null && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Próximamente: guardar tus precios sugeridos por cada servicio
        complementario.
      </p>
    </div>
  );
}
