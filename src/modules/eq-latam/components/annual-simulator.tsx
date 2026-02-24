'use client';

import { useState, useMemo } from 'react';
import type { PackId, TrainerRole, Modality, EventPlan } from '../types';
import { PACK_DEFINITIONS, ANNUAL_BUDGET } from '../lib/eq-data';
import {
  analizarEvento,
  simularAnual,
  calcularCompDirector,
  formatPriceUSD,
} from '../lib/eq-pricing-engine';
import { ViabilityBadge } from './viability-badge';
import { Plus, Trash2 } from 'lucide-react';

const PACK_IDS = Object.keys(PACK_DEFINITIONS) as PackId[];

export function AnnualSimulator() {
  const [events, setEvents] = useState<EventPlan[]>([
    createDefaultEvent('EQ Week 1', 'FULL_5', 'RF', 10, 3),
    createDefaultEvent('EQ Week 2', 'FULL_5', 'RF', 10, 6),
    createDefaultEvent('EQ Week 3', 'FULL_5', 'RF', 10, 10),
  ]);

  const simulation = useMemo(() => simularAnual(events), [events]);
  const directorComp = useMemo(
    () => calcularCompDirector(simulation.totalCertRevenue),
    [simulation.totalCertRevenue],
  );

  function createDefaultEvent(
    name: string,
    packId: PackId,
    trainerRole: TrainerRole,
    pax: number,
    month: number,
  ): EventPlan {
    const modality: Modality = trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
    const analysis = analizarEvento(packId, modality, pax, trainerRole);
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name,
      packId,
      modality,
      trainerRole,
      pax,
      isEqWeek: true,
      month,
      revenue: analysis.ingresoSugerido,
      cost: analysis.costoEntrega,
      profit: analysis.ingresoSugerido - analysis.costoEntrega,
    };
  }

  function addEvent() {
    const newEvent = createDefaultEvent(
      `Evento ${events.length + 1}`,
      'UEQ_BPC_EQAC',
      'RF',
      10,
      1,
    );
    setEvents(prev => [...prev, newEvent]);
  }

  function removeEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  function updateEvent(id: string, field: string, value: any) {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };

      // Recalculate revenue/cost when pack, pax, or trainer changes
      if (['packId', 'pax', 'trainerRole'].includes(field)) {
        const modality: Modality = updated.trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
        try {
          const analysis = analizarEvento(updated.packId, modality, updated.pax, updated.trainerRole);
          updated.modality = modality;
          updated.revenue = analysis.ingresoSugerido;
          updated.cost = analysis.costoEntrega;
          updated.profit = analysis.ingresoSugerido - analysis.costoEntrega;
        } catch {
          // Keep existing values
        }
      }
      return updated;
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Simulador Anual</h3>
        <p className="text-sm text-muted-foreground">Planifica eventos y proyecta ingresos vs presupuesto</p>
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="bg-white border rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 grid grid-cols-5 gap-2 text-sm">
              <input
                type="text"
                value={event.name}
                onChange={(e) => updateEvent(event.id, 'name', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
              <select
                value={event.packId}
                onChange={(e) => updateEvent(event.id, 'packId', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {PACK_IDS.map(id => (
                  <option key={id} value={id}>{PACK_DEFINITIONS[id].name}</option>
                ))}
              </select>
              <select
                value={event.pax}
                onChange={(e) => updateEvent(event.id, 'pax', parseInt(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                {[5, 10, 15].map(p => (
                  <option key={p} value={p}>{p} PAX</option>
                ))}
              </select>
              <select
                value={event.trainerRole}
                onChange={(e) => updateEvent(event.id, 'trainerRole', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="RF">RF</option>
                <option value="MT">MT</option>
              </select>
              <div className="text-right font-medium text-eq-blue">
                {formatPriceUSD(event.revenue)}
              </div>
            </div>
            <button
              onClick={() => removeEvent(event.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addEvent}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-eq-blue hover:text-eq-blue transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar Evento
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-eq-navy">Proyeccion Anual</h4>
          <ViabilityBadge
            level={simulation.isSustainable ? 'GO' : simulation.coveragePercent >= 60 ? 'MARGINAL' : 'NO_GO'}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Ingreso Certs</div>
            <div className="text-lg font-bold text-eq-blue">{formatPriceUSD(simulation.totalCertRevenue)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Costos Entrega</div>
            <div className="text-lg font-bold text-red-600">{formatPriceUSD(simulation.totalCertCosts)}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Utilidad Bruta</div>
            <div className={`text-lg font-bold ${simulation.totalCertProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPriceUSD(simulation.totalCertProfit)}
            </div>
          </div>
        </div>

        {/* Budget gap coverage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Cobertura del gap ({formatPriceUSD(simulation.budgetGap)})
            </span>
            <span className="font-semibold">{simulation.coveragePercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all ${
                simulation.coveragePercent >= 100 ? 'bg-green-500' :
                simulation.coveragePercent >= 60 ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(simulation.coveragePercent, 100)}%` }}
            />
          </div>
          {simulation.gapRemaining > 0 && (
            <p className="text-xs text-red-600">
              Faltan {formatPriceUSD(simulation.gapRemaining)} para cubrir el gap
            </p>
          )}
        </div>

        {/* Director comp */}
        <div className="bg-eq-cream rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Compensacion Director (retainer)</span>
            <span className="font-medium">{formatPriceUSD(directorComp.retainer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comision (10% de {formatPriceUSD(simulation.totalCertRevenue)})</span>
            <span className="font-medium">{formatPriceUSD(directorComp.comision)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total compensacion</span>
            <span className="text-eq-blue">{formatPriceUSD(directorComp.total)}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`text-sm p-3 rounded-lg ${
          simulation.isSustainable ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
        }`}>
          {simulation.recommendation}
        </div>
      </div>
    </div>
  );
}
