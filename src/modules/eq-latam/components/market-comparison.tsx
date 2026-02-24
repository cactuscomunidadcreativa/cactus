'use client';

import { useMemo } from 'react';
import { compararMercadoCompleto, formatPriceUSD, getPositionLabel, getPositionColor } from '../lib/eq-pricing-engine';
import { GLOBAL_FULL_ONLINE_PRICE, MASTER_PRICE_LIST } from '../lib/eq-data';

export function MarketComparison() {
  const comparisons = useMemo(() => compararMercadoCompleto(), []);

  const fullComparison = {
    eqLatam: MASTER_PRICE_LIST.FULL.pvpSugerido,
    global: GLOBAL_FULL_ONLINE_PRICE,
    diferenciaPct: Math.round(((GLOBAL_FULL_ONLINE_PRICE - MASTER_PRICE_LIST.FULL.pvpSugerido) / GLOBAL_FULL_ONLINE_PRICE) * 100),
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Comparacion de Mercado</h3>
        <p className="text-sm text-muted-foreground">EQ Latam vs 6 Seconds Global — precios On Demand</p>
      </div>

      {/* Main comparison table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-eq-navy text-white">
              <th className="text-left px-4 py-3 font-medium">Cert</th>
              <th className="text-right px-4 py-3 font-medium">EQ Latam</th>
              <th className="text-right px-4 py-3 font-medium">6S Global</th>
              <th className="text-right px-4 py-3 font-medium">Diferencia</th>
              <th className="text-center px-4 py-3 font-medium">Posicion</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, i) => (
              <tr key={comp.certId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-semibold">{comp.certId}</td>
                <td className="px-4 py-3 text-right font-medium text-eq-blue">
                  {formatPriceUSD(comp.eqLatamSugerido)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatPriceUSD(comp.global6SOnline)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-eq-teal">
                  {comp.diferenciaPct}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getPositionColor(comp.posicion) }}
                  >
                    {getPositionLabel(comp.posicion)}
                  </span>
                </td>
              </tr>
            ))}
            {/* FULL pack row */}
            <tr className="bg-eq-cream border-t-2 border-eq-gold">
              <td className="px-4 py-3 font-bold">FULL 5</td>
              <td className="px-4 py-3 text-right font-bold text-eq-blue">
                {formatPriceUSD(fullComparison.eqLatam)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatPriceUSD(fullComparison.global)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-eq-teal">
                {fullComparison.diferenciaPct}%
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white bg-purple-600">
                  Excepcional
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Context */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h4 className="font-semibold text-eq-navy">Contexto Mercado Latam</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between py-1 border-b">
            <span>Certificaciones ICF coaching presencial</span>
            <span className="font-medium text-foreground">$3,500 - $15,000</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span>Diplomados IE online (semestral)</span>
            <span className="font-medium text-foreground">$448 - $640</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span>EQ-i 2.0 (MHS, competidor)</span>
            <span className="font-medium text-foreground">Rango similar a EQPC</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Programas IE genericos Latam</span>
            <span className="font-medium text-foreground">$99 - $769</span>
          </div>
        </div>
        <p className="text-xs text-eq-teal font-medium mt-2">
          EQ Latam ofrece certificaciones con marca 6 Seconds a precios significativamente mas accesibles que el mercado global, manteniendo calidad y acreditacion ICF/SHRM.
        </p>
      </div>
    </div>
  );
}
