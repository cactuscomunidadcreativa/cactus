'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Download, DollarSign } from 'lucide-react';
import { fetchQuotes } from '../lib/eq-db';
import {
  calcPayrollForPeriod,
  formatPeriod,
  listRecentPeriods,
  payrollTotals,
  type PayrollLine,
} from '../lib/eq-payroll';
import { formatPriceUSD } from '..';
import type { Quote } from '../types/organization';

/**
 * Admin payroll / liquidación panel.
 *
 * Shows what to pay this month: base salary per team member + commissions
 * from closed deals. Eduardo can mark each line as paid.
 *
 * Paid status is kept in localStorage until eq_payroll_payments is wired
 * with the API (migration 028 ready).
 */
export function PayrollPanel() {
  const [period, setPeriod] = useState<string>(formatPeriod());
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [paidStatus, setPaidStatus] = useState<Record<string, 'paid' | 'pending'>>(
    () => loadPaidStatus(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchQuotes().then(rows => {
      if (!cancelled) {
        setAllQuotes(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const lines = useMemo<PayrollLine[]>(
    () => calcPayrollForPeriod(period, allQuotes, paidStatus),
    [period, allQuotes, paidStatus],
  );

  const totals = useMemo(() => payrollTotals(lines), [lines]);

  const togglePaid = (lineId: string) => {
    setPaidStatus(prev => {
      const next = { ...prev };
      next[lineId] = prev[lineId] === 'paid' ? 'pending' : 'paid';
      savePaidStatus(next);
      return next;
    });
  };

  const exportCSV = () => {
    const header = 'Período,Receptor,Tipo,Categoría,Monto USD,Estado';
    const rows = lines.map(l =>
      [
        period,
        `"${l.recipient_name}"`,
        l.recipient_kind,
        `"${l.category_label}"`,
        l.amount_usd.toFixed(2),
        l.status,
      ].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidacion-six-seconds-latam-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header + period selector */}
      <div className="bg-eq-cream/40 border rounded-xl p-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-eq-blue mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Liquidación de pagos</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sueldos base + comisiones del período. Marca cada línea conforme la
              pagues. Los referenciadores externos (Yisseth, etc.) aparecen aparte.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5 bg-white"
          >
            {listRecentPeriods(12).map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TotalCard label="Total del período" value={totals.totalDue} variant="neutral" />
        <TotalCard label="Pendiente de pago" value={totals.totalPending} variant="warning" />
        <TotalCard label="Ya pagado" value={totals.totalPaid} variant="success" />
      </div>

      {/* Lines table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Receptor</th>
              <th className="text-left px-4 py-2 font-medium">Concepto</th>
              <th className="text-right px-4 py-2 font-medium">Monto</th>
              <th className="text-center px-4 py-2 font-medium">Estado</th>
              <th className="text-right px-4 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-8">
                  Cargando…
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay líneas para este período.
                </td>
              </tr>
            ) : (
              lines.map(l => (
                <tr key={l.id} className={`border-t ${l.status === 'paid' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.recipient_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.recipient_kind === 'referrer' ? 'Referenciador externo' : 'Equipo interno'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.category_label}
                    {l.source_quote_ids && l.source_quote_ids.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {l.source_quote_ids.length} cotizaciones cerradas
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPriceUSD(l.amount_usd)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {l.status === 'paid' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Pagado
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => togglePaid(l.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                        l.status === 'paid'
                          ? 'border hover:bg-gray-50'
                          : 'bg-emerald-600 text-white hover:opacity-90'
                      }`}
                    >
                      {l.status === 'paid' ? 'Marcar pendiente' : 'Marcar pagado'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Estados de pago se persisten localmente. Cuando apliques migration 028
        (eq_payroll_payments) se persisten en Supabase con histórico completo.
      </p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function TotalCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'neutral' | 'warning' | 'success';
}) {
  const colors = {
    neutral: 'border bg-white text-eq-navy',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[variant];
  return (
    <div className={`rounded-xl p-4 ${colors}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-bold">{formatPriceUSD(value)}</div>
    </div>
  );
}

// ============================================================
// localStorage persistence (pre-Supabase)
// ============================================================
const STORAGE_KEY = 'eq-latam-payroll-paid-status';

function loadPaidStatus(): Record<string, 'paid' | 'pending'> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePaidStatus(s: Record<string, 'paid' | 'pending'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}
