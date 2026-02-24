'use client';

import { useState, useMemo } from 'react';
import type { PackId, TrainerRole } from '../types';
import { PACK_DEFINITIONS } from '../lib/eq-data';
import { analizarEvento, formatPriceUSD, getViabilityLabel } from '../lib/eq-pricing-engine';
import { ViabilityBadge } from './viability-badge';

const PACK_IDS = Object.keys(PACK_DEFINITIONS) as PackId[];
const PAX_OPTIONS = [5, 10, 15];

export function EventAnalyzer() {
  const [packId, setPackId] = useState<PackId>('FULL_5');
  const [pax, setPax] = useState(10);
  const [trainerRole, setTrainerRole] = useState<TrainerRole>('RF');

  const analysis = useMemo(() => {
    try {
      const modality = trainerRole === 'MT' ? 'in_person_mt' as const : 'in_person_rf' as const;
      return analizarEvento(packId, modality, pax, trainerRole);
    } catch {
      return null;
    }
  }, [packId, pax, trainerRole]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Analizador de Eventos</h3>
        <p className="text-sm text-muted-foreground">Evalua la viabilidad financiera de un evento presencial</p>
      </div>

      {/* Controls */}
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
            {PAX_OPTIONS.map(p => (
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
            <option value="RF">Regional Facilitator (RF)</option>
            <option value="MT">Master Trainer (MT)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-eq-navy">{PACK_DEFINITIONS[packId].name} [{trainerRole}]</h4>
              <p className="text-sm text-muted-foreground">{pax} participantes | Presencial</p>
            </div>
            <ViabilityBadge level={analysis.viability} size="lg" />
          </div>

          {/* Cost breakdown */}
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Costos del Evento</h5>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Costo fijo facilitacion</span>
                <span className="font-medium">{formatPriceUSD(analysis.costoFijo)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Materiales ({pax} PAX)</span>
                <span className="font-medium">{formatPriceUSD(analysis.costoMateriales)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Costo variable ({pax} PAX)</span>
                <span className="font-medium">{formatPriceUSD(analysis.costoVariable)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t font-semibold">
                <span>TOTAL COSTO ENTREGA</span>
                <span className="text-eq-navy">{formatPriceUSD(analysis.costoEntrega)}</span>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ingresos</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">PVP Sugerido</div>
                <div className="text-lg font-bold text-eq-blue">{formatPriceUSD(analysis.ingresoSugerido)}</div>
              </div>
              <div className="bg-teal-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Al Partner</div>
                <div className="text-lg font-bold text-eq-teal">{formatPriceUSD(analysis.ingresoPartner)}</div>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-eq-cream rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto 6S (x50%):</span>
              <span className="font-semibold">{formatPriceUSD(analysis.neto6SSugerido)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio minimo autosustentable:</span>
              <span className="font-semibold">{formatPriceUSD(analysis.precioMinimoAutosustentable)}/PAX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAX minimo para viabilidad:</span>
              <span className="font-semibold">{analysis.paxMinimoParaViabilidad} personas</span>
            </div>
          </div>

          {/* Viability reason */}
          <div className={`text-sm p-3 rounded-lg ${
            analysis.viability === 'GO' ? 'bg-green-50 text-green-800' :
            analysis.viability === 'MARGINAL' ? 'bg-amber-50 text-amber-800' :
            'bg-red-50 text-red-800'
          }`}>
            {analysis.viabilityReason}
          </div>
        </div>
      )}
    </div>
  );
}
