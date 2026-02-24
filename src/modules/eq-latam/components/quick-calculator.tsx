'use client';

import { useState, useMemo } from 'react';
import type { CertificationId, Modality, TrainerRole } from '../types';
import { ALL_CERT_IDS, MODALITY_LABELS, PAX_OPTIONS_BY_MODALITY } from '../lib/eq-data';
import { calcularPrecioCert } from '../lib/eq-pricing-engine';
import { PricingResultCard } from './pricing-result-card';

export function QuickCalculator() {
  const [certId, setCertId] = useState<CertificationId>('EQPC');
  const [modality, setModality] = useState<Modality>('group_online');
  const [pax, setPax] = useState(10);
  const [trainerRole, setTrainerRole] = useState<TrainerRole>('RF');

  const paxOptions = useMemo(() => PAX_OPTIONS_BY_MODALITY[modality] || [1], [modality]);

  // Ensure pax is valid for the selected modality
  const effectivePax = useMemo(() => {
    if (modality === 'on_demand') return 1;
    if (!paxOptions.includes(pax)) return paxOptions[paxOptions.length - 1] || 10;
    return pax;
  }, [modality, pax, paxOptions]);

  const result = useMemo(() => {
    try {
      const role = modality.startsWith('in_person') ? trainerRole : undefined;
      return calcularPrecioCert(certId, modality, effectivePax, role);
    } catch {
      return null;
    }
  }, [certId, modality, effectivePax, trainerRole]);

  const showTrainerRole = modality === 'in_person_mt' || modality === 'in_person_rf';

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-eq-navy mb-1">Calculadora Rapida</h3>
        <p className="text-sm text-muted-foreground">Selecciona certificacion, modalidad y numero de participantes</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Certification */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Certificacion</label>
          <select
            value={certId}
            onChange={(e) => setCertId(e.target.value as CertificationId)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
          >
            {ALL_CERT_IDS.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        {/* Modality */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Modalidad</label>
          <select
            value={modality}
            onChange={(e) => {
              const newMod = e.target.value as Modality;
              setModality(newMod);
              if (newMod === 'in_person_mt') setTrainerRole('MT');
              if (newMod === 'in_person_rf') setTrainerRole('RF');
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
          >
            {Object.entries(MODALITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* PAX */}
        {modality !== 'on_demand' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Participantes (PAX)</label>
            <select
              value={effectivePax}
              onChange={(e) => setPax(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
            >
              {paxOptions.map(p => (
                <option key={p} value={p}>{p} personas</option>
              ))}
            </select>
          </div>
        )}

        {/* Trainer Role */}
        {showTrainerRole && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Trainer</label>
            <select
              value={trainerRole}
              onChange={(e) => setTrainerRole(e.target.value as TrainerRole)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eq-blue/50"
            >
              <option value="MT">Master Trainer (MT)</option>
              <option value="RF">Regional Facilitator (RF)</option>
            </select>
          </div>
        )}
      </div>

      {/* Result */}
      {result && <PricingResultCard result={result} />}
      {!result && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay datos disponibles para esta combinacion.
        </div>
      )}
    </div>
  );
}
