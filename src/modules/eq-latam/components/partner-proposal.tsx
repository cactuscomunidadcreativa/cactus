'use client';

import { useState, useMemo } from 'react';
import type { PackId, TrainerRole, Modality } from '../types';
import { PACK_DEFINITIONS } from '../lib/eq-data';
import { calcularPrecioPack, formatPriceUSD, formatPercent, getViabilityLabel } from '../lib/eq-pricing-engine';
import { ViabilityBadge } from './viability-badge';

const PACK_IDS = Object.keys(PACK_DEFINITIONS) as PackId[];

export function PartnerProposal() {
  const [partnerName, setPartnerName] = useState('');
  const [packId, setPackId] = useState<PackId>('FULL_5');
  const [pax, setPax] = useState(10);
  const [trainerRole, setTrainerRole] = useState<TrainerRole>('RF');

  const pricing = useMemo(() => {
    try {
      const modality: Modality = trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
      return calcularPrecioPack(packId, modality, pax, trainerRole);
    } catch {
      return null;
    }
  }, [packId, pax, trainerRole]);

  const savingsVsRetail = pricing
    ? pricing.totalSugerido - pricing.totalPartner
    : 0;

  const handleCopy = () => {
    if (!pricing) return;
    const name = partnerName || 'Partner';
    const text = `PROPUESTA EQ LATAM — ${name}
Fecha: ${new Date().toLocaleDateString()}

${PACK_DEFINITIONS[packId].name} | ${pax} PAX | ${trainerRole}

Precio Partner: ${formatPriceUSD(pricing.precioPartnerPorPax)}/PAX
Total inversion: ${formatPriceUSD(pricing.totalPartner)}

Precio publico sugerido: ${formatPriceUSD(pricing.pvpSugeridoPorPax)}/PAX
Ahorro vs precio publico: ${formatPriceUSD(savingsVsRetail)} (30%)

Validez: 30 dias
---
EQ Latam | Six Seconds Regional Partner`;

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Propuesta Partner</h3>
        <p className="text-sm text-muted-foreground">Genera cotizaciones con precio partner (-30%)</p>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre del Partner</label>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Nombre de la organizacion..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Pack</label>
            <select
              value={packId}
              onChange={(e) => setPackId(e.target.value as PackId)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
            >
              {PACK_IDS.map(id => (
                <option key={id} value={id}>{PACK_DEFINITIONS[id].name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">PAX</label>
            <select
              value={pax}
              onChange={(e) => setPax(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
            >
              {[5, 10, 15, 20].map(p => (
                <option key={p} value={p}>{p} personas</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Trainer</label>
            <select
              value={trainerRole}
              onChange={(e) => setTrainerRole(e.target.value as TrainerRole)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
            >
              <option value="RF">RF</option>
              <option value="MT">MT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposal preview */}
      {pricing && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-eq-navy">
                PROPUESTA — {partnerName || 'Partner'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {PACK_DEFINITIONS[packId].name} | {pax} PAX | {trainerRole}
              </p>
            </div>
            <ViabilityBadge level={pricing.viability} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-50 rounded-lg p-4">
              <div className="text-xs text-muted-foreground">Precio Partner / PAX</div>
              <div className="text-2xl font-bold text-eq-teal">{formatPriceUSD(pricing.precioPartnerPorPax)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-muted-foreground">Total Inversion</div>
              <div className="text-2xl font-bold text-eq-blue">{formatPriceUSD(pricing.totalPartner)}</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Precio publico sugerido</span>
              <span className="font-medium">{formatPriceUSD(pricing.pvpSugeridoPorPax)}/PAX</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total a precio publico</span>
              <span className="font-medium">{formatPriceUSD(pricing.totalSugerido)}</span>
            </div>
            <div className="flex justify-between py-1 font-semibold text-eq-teal">
              <span>Ahorro del partner</span>
              <span>{formatPriceUSD(savingsVsRetail)} (30%)</span>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2 bg-eq-blue text-white rounded-lg text-sm font-medium hover:bg-eq-blue/90 transition-colors"
          >
            Copiar Propuesta
          </button>
        </div>
      )}
    </div>
  );
}
