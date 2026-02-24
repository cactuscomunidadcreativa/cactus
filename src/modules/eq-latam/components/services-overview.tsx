'use client';

import { useMemo } from 'react';
import { getBudgetOverview, formatPriceUSD } from '../lib/eq-pricing-engine';

export function ServicesOverview() {
  const budget = useMemo(() => getBudgetOverview(), []);

  const coveragePct = budget.totalNonCertIncome > 0
    ? Math.round((budget.totalNonCertIncome / budget.totalCosts) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Servicios & Presupuesto</h3>
        <p className="text-sm text-muted-foreground">Desglose de ingresos EQ Biz, Impact y costos operativos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Costos Anuales</div>
          <div className="text-xl font-bold text-red-600">{formatPriceUSD(budget.totalCosts)}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Ingresos No-Cert</div>
          <div className="text-xl font-bold text-eq-teal">{formatPriceUSD(budget.totalNonCertIncome)}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Gap (Certs)</div>
          <div className="text-xl font-bold text-eq-gold">{formatPriceUSD(budget.certGap)}</div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Cobertura presupuestal por servicios</span>
          <span className="font-semibold">{coveragePct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-eq-teal rounded-full h-3 transition-all"
            style={{ width: `${Math.min(coveragePct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Los servicios cubren {coveragePct}% de los costos. El {100 - coveragePct}% restante ({formatPriceUSD(budget.certGap)}) debe ser cubierto por certificaciones.
        </p>
      </div>

      {/* Non-cert income breakdown */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h4 className="font-semibold text-eq-navy">Ingresos por Servicios</h4>
        <div className="space-y-1">
          {budget.nonCertIncome.map((item, i) => {
            const pct = budget.totalNonCertIncome > 0
              ? Math.round((item.amount / budget.totalNonCertIncome) * 100)
              : 0;
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatPriceUSD(item.amount)}</div>
                  <div className="text-xs text-muted-foreground">{pct}%</div>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-eq-blue rounded-full h-2"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between pt-3 border-t font-semibold">
          <span>Total</span>
          <span className="text-eq-teal">{formatPriceUSD(budget.totalNonCertIncome)}</span>
        </div>
      </div>

      {/* Fixed costs breakdown */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h4 className="font-semibold text-eq-navy">Costos Fijos</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(budget.byCategory).map(([cat, amount]) => (
            <div key={cat} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground capitalize">{cat}</div>
              <div className="text-sm font-semibold">{formatPriceUSD(amount)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2 text-sm">
          <span className="text-muted-foreground">Variable (staff eventos):</span>
          <span className="font-semibold">{formatPriceUSD(budget.variableCosts)}</span>
        </div>
      </div>
    </div>
  );
}
