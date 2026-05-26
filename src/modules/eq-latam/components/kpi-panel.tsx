'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Save, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  KPI_CATALOG,
  currentIsoWeek,
  currentMonth,
  formatKpiValue,
  kpisForArea,
  listRecentMonths,
  listRecentWeeks,
  type KpiDefinition,
} from '../lib/eq-kpi-catalog';
import { fetchKpiValues, saveKpiValue, importKpiValues, type KpiValueRow } from '../lib/eq-db';
import type { AreaId } from '../types/organization';

/**
 * Editable KPI panel for a given area.
 *
 * - Period selector (monthly / weekly + period dropdown).
 * - Table: KPI · last 6 periods · target · trend.
 * - Edit a cell to update the value; saved immediately.
 * - Import: paste CSV (kpi_code,period_label,value) — bulk upsert.
 * - Export: CSV of the visible window.
 */
export function KpiPanel({ areaId, areaName }: { areaId: AreaId; areaName: string }) {
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [values, setValues] = useState<KpiValueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const kpis = useMemo(() => kpisForArea(areaId), [areaId]);
  const periods = useMemo(
    () => (periodType === 'monthly' ? listRecentMonths(6) : listRecentWeeks(6)),
    [periodType],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchKpiValues(areaId, periodType).then(rows => {
      if (!cancelled) {
        setValues(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [areaId, periodType]);

  const valueFor = (kpiCode: string, period: string) =>
    values.find(
      v => v.kpi_code === kpiCode && v.period_label === period && v.period_type === periodType,
    );

  const updateCell = async (kpi: KpiDefinition, period: string, raw: string) => {
    const v = raw === '' || raw === '—' ? null : Number(raw);
    const key = `${kpi.code}-${period}`;
    setSavingCell(key);
    const row: KpiValueRow = {
      area_id: areaId,
      kpi_code: kpi.code,
      period_type: periodType,
      period_label: period,
      value: v,
      target: kpi.target,
    };
    await saveKpiValue(row);
    setValues(prev => {
      const idx = prev.findIndex(
        x => x.kpi_code === kpi.code && x.period_label === period && x.period_type === periodType,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    setSavingCell(null);
  };

  const trendArrow = (kpi: KpiDefinition) => {
    // Compare latest two periods that have a value
    const series = periods
      .slice()
      .reverse()
      .map(p => valueFor(kpi.code, p)?.value)
      .filter((v): v is number => v != null);
    if (series.length < 2) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    if (last === prev) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const goingUp = last > prev;
    const good = goingUp === kpi.higher_is_better;
    return goingUp ? (
      <TrendingUp className={`w-3 h-3 ${good ? 'text-emerald-600' : 'text-red-600'}`} />
    ) : (
      <TrendingDown className={`w-3 h-3 ${good ? 'text-emerald-600' : 'text-red-600'}`} />
    );
  };

  const exportCSV = () => {
    const header = ['area', 'kpi_code', 'kpi_label', 'period_type', 'period', 'value', 'target', 'unit'];
    const rows = [header.join(',')];
    for (const k of kpis) {
      for (const p of periods) {
        const v = valueFor(k.code, p);
        rows.push([
          areaId,
          k.code,
          `"${k.label}"`,
          periodType,
          p,
          v?.value ?? '',
          k.target ?? '',
          k.unit,
        ].join(','));
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpis-${areaId}-${periodType}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-eq-cream/40 border rounded-xl p-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-eq-blue mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">KPIs · {areaName}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kpis.length} indicadores · edita cualquier celda para guardar · semanal o mensual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setPeriodType('monthly')}
              className={`text-xs px-3 py-1.5 ${periodType === 'monthly' ? 'bg-eq-blue text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPeriodType('weekly')}
              className={`text-xs px-3 py-1.5 ${periodType === 'weekly' ? 'bg-eq-blue text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Semanal
            </button>
          </div>
          <button
            onClick={() => setImportOpen(true)}
            className="text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" /> Importar
          </button>
          <button
            onClick={exportCSV}
            className="text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium min-w-[200px]">KPI</th>
              <th className="text-center px-2 py-2 font-medium">Trend</th>
              {periods.slice().reverse().map(p => {
                const current = p === (periodType === 'monthly' ? currentMonth() : currentIsoWeek());
                return (
                  <th
                    key={p}
                    className={`text-right px-2 py-2 font-medium min-w-[80px] ${current ? 'bg-eq-blue/10 text-eq-blue' : ''}`}
                  >
                    {p}
                  </th>
                );
              })}
              <th className="text-right px-3 py-2 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={periods.length + 3} className="text-center text-muted-foreground py-8">
                  Cargando KPIs…
                </td>
              </tr>
            ) : kpis.length === 0 ? (
              <tr>
                <td colSpan={periods.length + 3} className="text-center text-muted-foreground py-8">
                  No hay KPIs definidos para esta área.
                </td>
              </tr>
            ) : (
              kpis.map(k => (
                <tr key={k.code} className="border-t hover:bg-gray-50/50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-sm">{k.label}</div>
                    <div className="text-xs text-muted-foreground">{k.description}</div>
                  </td>
                  <td className="px-2 py-2 text-center">{trendArrow(k)}</td>
                  {periods.slice().reverse().map(p => {
                    const v = valueFor(k.code, p);
                    const key = `${k.code}-${p}`;
                    return (
                      <td key={p} className="px-2 py-1 text-right">
                        <KpiCell
                          value={v?.value ?? null}
                          unit={k.unit}
                          higherIsBetter={k.higher_is_better}
                          target={k.target}
                          saving={savingCell === key}
                          onSave={raw => updateCell(k, p, raw)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {k.target != null ? formatKpiValue(k.target, k.unit) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tip: click en cualquier celda para editar. Importa con CSV
        (columnas: <code>kpi_code, period_label, value</code>) para reportes en lote.
      </p>

      {importOpen && (
        <ImportKpiModal
          areaId={areaId}
          periodType={periodType}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            fetchKpiValues(areaId, periodType).then(setValues);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Editable cell
// ============================================================
function KpiCell({
  value,
  unit,
  saving,
  onSave,
}: {
  value: number | null;
  unit: KpiDefinition['unit'];
  higherIsBetter: boolean;
  target?: number;
  saving: boolean;
  onSave: (raw: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState<string>(value != null ? String(value) : '');

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (raw !== (value != null ? String(value) : '')) onSave(raw);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setRaw(value != null ? String(value) : '');
            setEditing(false);
          }
        }}
        className="w-20 text-right text-sm border rounded px-1.5 py-0.5"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-sm hover:bg-gray-100 px-2 py-1 rounded inline-block min-w-[60px] text-right ${
        value == null ? 'text-muted-foreground italic' : 'font-medium'
      } ${saving ? 'opacity-50' : ''}`}
    >
      {saving ? '…' : value == null ? '—' : formatKpiValue(value, unit)}
    </button>
  );
}

// ============================================================
// Import CSV modal
// ============================================================
function ImportKpiModal({
  areaId,
  periodType,
  onClose,
  onImported,
}: {
  areaId: AreaId;
  periodType: 'weekly' | 'monthly';
  onClose: () => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const parseAndImport = async () => {
    setBusy(true);
    const rows: KpiValueRow[] = [];
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Skip header
      if (line.toLowerCase().startsWith('kpi_code')) continue;
      const [kpi_code, period_label, valueStr] = line.split(',').map(s => s.trim());
      if (!kpi_code || !period_label) continue;
      const value = valueStr === '' || valueStr == null ? null : Number(valueStr);
      const kpiDef = KPI_CATALOG.find(k => k.code === kpi_code && k.area_id === areaId);
      if (!kpiDef) continue; // unknown code for this area
      rows.push({
        area_id: areaId,
        kpi_code,
        period_type: periodType,
        period_label,
        value,
        target: kpiDef.target,
      });
    }
    const count = await importKpiValues(rows);
    setResult(`Importados ${count} de ${rows.length} valores. ${lines.length - rows.length} líneas ignoradas (headers o KPIs no reconocidos).`);
    setBusy(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Importar KPIs ({periodType})</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pega filas CSV. Una línea por valor.
            Formato: <code>kpi_code,period_label,value</code>
            Ejemplo: <code>leads_generated,2026-W21,42</code> o <code>cac,2026-05,180</code>
          </p>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={csv}
            onChange={e => setCsv(e.target.value)}
            rows={8}
            placeholder={`leads_generated,2026-W21,42
mqls,2026-W21,15
cac,2026-05,180`}
            className="w-full text-sm font-mono border rounded-lg px-3 py-2"
          />
          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              {result}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            onClick={parseAndImport}
            disabled={busy || !csv.trim()}
            className="text-sm px-4 py-2 bg-eq-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
