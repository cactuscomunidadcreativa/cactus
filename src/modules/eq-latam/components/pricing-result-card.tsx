'use client';

import type { PricingResult } from '../types';
import { formatPriceUSD, formatPercent } from '../lib/eq-pricing-engine';

interface PricingResultCardProps {
  result: PricingResult;
  compact?: boolean;
}

export function PricingResultCard({ result, compact = false }: PricingResultCardProps) {
  if (compact) {
    return (
      <div className="bg-white border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-eq-navy">{result.certId}</span>
          <span className="text-lg font-bold text-eq-blue">{formatPriceUSD(result.pvpSugerido)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Costo: {formatPriceUSD(result.costoReal)}</span>
          <span>Partner: {formatPriceUSD(result.precioPartner)}</span>
          <span className="text-eq-teal">{result.descuentoVsGlobal}% vs 6S</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-eq-navy">{result.certId}</h3>
          <p className="text-sm text-muted-foreground">
            {result.pax} PAX | {result.modality.replace(/_/g, ' ')}
            {result.trainerRole ? ` (${result.trainerRole})` : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-eq-blue">{formatPriceUSD(result.pvpSugerido)}</div>
          <div className="text-xs text-muted-foreground">PVP Sugerido / PAX</div>
        </div>
      </div>

      {/* Price tiers */}
      <div className="grid grid-cols-2 gap-3">
        <PriceTier
          label="Costo Real"
          amount={result.costoReal}
          perPax
          color="#6B7280"
        />
        <PriceTier
          label="PVP Minimo"
          amount={result.pvpMinimo}
          perPax
          color="#F59E0B"
        />
        <PriceTier
          label="PVP Sugerido"
          amount={result.pvpSugerido}
          perPax
          color="#1E6B8A"
          highlighted
        />
        <PriceTier
          label="Precio Partner"
          amount={result.precioPartner}
          perPax
          color="#1A8A7A"
        />
      </div>

      {/* Totals */}
      {result.pax > 1 && (
        <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Total Sugerido:</span>
            <span className="ml-2 font-semibold">{formatPriceUSD(result.totalRevenueSugerido)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Partner:</span>
            <span className="ml-2 font-semibold">{formatPriceUSD(result.totalRevenuePartner)}</span>
          </div>
        </div>
      )}

      {/* Market comparison */}
      <div className="border-t pt-3 flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">6S Global: </span>
          <span className="font-medium">{formatPriceUSD(result.precio6SGlobal)}</span>
        </div>
        <span className="text-eq-teal font-semibold">
          {result.descuentoVsGlobal}% mas accesible
        </span>
      </div>

      {/* Net */}
      <div className="bg-eq-cream rounded-lg p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Neto 6S (x50%):</span>
          <span className="font-semibold">{formatPriceUSD(result.neto6S)}/PAX</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-muted-foreground">Margen sugerido:</span>
          <span className="font-semibold">{formatPercent(result.margenSugerido)}</span>
        </div>
      </div>
    </div>
  );
}

function PriceTier({
  label,
  amount,
  perPax,
  color,
  highlighted,
}: {
  label: string;
  amount: number;
  perPax?: boolean;
  color: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${highlighted ? 'ring-2' : ''}`}
      style={{
        backgroundColor: `${color}08`,
        borderLeft: `3px solid ${color}`,
        ...(highlighted ? { ringColor: color } : {}),
      }}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>
        {formatPriceUSD(amount)}
      </div>
      {perPax && <div className="text-xs text-muted-foreground">por persona</div>}
    </div>
  );
}
