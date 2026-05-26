'use client';

import { useMemo, useState } from 'react';
import { Calculator, FileText, Minus, Plus, ShoppingCart } from 'lucide-react';
import {
  ASSESSMENTS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  GRADUATE_DEFAULT_MARKUP_MULTIPLIER,
  type Assessment,
  type AssessmentCategory,
} from '../lib/eq-assessments-catalog';
import { formatPriceUSD } from '../lib/eq-pricing-engine';
import { generateGraduateProposalPDF } from '../lib/eq-pdf';

/**
 * Graduate / Practitioner public calculator.
 *
 * Audience: Six Seconds certified practitioners (graduates of any cert).
 * They pick assessments + quantities to use with their own end client.
 *
 * They see:
 *   - Total credits needed
 *   - Cost from 6S Latam (1 credit = $1)
 *   - Suggested retail to their client (configurable markup, default 2×)
 *   - Their margin
 *
 * They never see 6S Latam's internal model.
 */
export function GraduateCalculator() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [markup, setMarkup] = useState<number>(GRADUATE_DEFAULT_MARKUP_MULTIPLIER);
  const [graduateName, setGraduateName] = useState('');
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');

  const updateQty = (code: string, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      const current = next[code] ?? 0;
      const newVal = Math.max(0, current + delta);
      if (newVal === 0) {
        delete next[code];
      } else {
        next[code] = newVal;
      }
      return next;
    });
  };

  const setQty = (code: string, val: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (val <= 0) delete next[code];
      else next[code] = val;
      return next;
    });
  };

  const totals = useMemo(() => {
    let totalCredits = 0;
    let totalItems = 0;
    const lines: Array<{ assessment: Assessment; qty: number; credits: number }> = [];
    for (const [code, qty] of Object.entries(cart)) {
      const a = ASSESSMENTS.find(x => x.code === code);
      if (!a || qty <= 0) continue;
      const credits = a.credits * qty;
      totalCredits += credits;
      totalItems += qty;
      lines.push({ assessment: a, qty, credits });
    }
    const costUsd = totalCredits; // 1 credit = $1
    const retailUsd = costUsd * markup;
    const margin = retailUsd - costUsd;
    const marginPct = retailUsd > 0 ? margin / retailUsd : 0;
    return { totalCredits, totalItems, lines, costUsd, retailUsd, margin, marginPct };
  }, [cart, markup]);

  const byCategory = useMemo(() => {
    const groups: Record<AssessmentCategory, Assessment[]> = {} as any;
    for (const cat of CATEGORY_ORDER) groups[cat] = [];
    for (const a of ASSESSMENTS) groups[a.category].push(a);
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-eq-gradient flex items-center justify-center text-white text-sm font-bold">
              EQ
            </div>
            <div>
              <h1 className="font-display font-bold text-eq-navy text-base">
                Calculadora para Practitioners
              </h1>
              <p className="text-xs text-muted-foreground">
                Six Seconds Latam · Cotiza tu engagement con créditos
              </p>
            </div>
          </div>
          <a
            href="https://6sec.org/calc"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-eq-blue"
          >
            ¿Ya conoces 6sec.org/calc? Esta es la versión Latam →
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {CATEGORY_ORDER.map(cat => (
            <CategorySection
              key={cat}
              title={CATEGORY_LABELS[cat]}
              items={byCategory[cat]}
              cart={cart}
              onAdd={code => updateQty(code, +1)}
              onRemove={code => updateQty(code, -1)}
              onSet={(code, val) => setQty(code, val)}
            />
          ))}
        </div>

        {/* Sticky cart / quote summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-4 lg:sticky lg:top-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" /> Tu cotización
            </h3>

            {totals.lines.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Selecciona assessments del catálogo para empezar.
              </p>
            ) : (
              <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                {totals.lines.map(({ assessment, qty, credits }) => (
                  <div key={assessment.code} className="flex justify-between text-xs">
                    <span className="truncate pr-2">
                      {qty}× {assessment.name}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {credits} cr
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total créditos</span>
                <strong>{totals.totalCredits}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo en 6S Latam</span>
                <strong>{formatPriceUSD(totals.costUsd)}</strong>
              </div>

              <div className="border-t pt-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  Tu markup al cliente
                </label>
                <div className="flex gap-1">
                  {[1.5, 2, 2.5, 3].map(m => (
                    <button
                      key={m}
                      onClick={() => setMarkup(m)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border ${
                        markup === m
                          ? 'bg-eq-blue text-white border-eq-blue'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {m}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-base pt-2 border-t">
                <span>Precio al cliente</span>
                <strong className="text-emerald-600">
                  {formatPriceUSD(totals.retailUsd)}
                </strong>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tu margen</span>
                <span>
                  {formatPriceUSD(totals.margin)} (
                  {(totals.marginPct * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Quote details */}
            <div className="border-t pt-3 space-y-2">
              <input
                type="text"
                placeholder="Tu nombre (practitioner)"
                value={graduateName}
                onChange={e => setGraduateName(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-1.5"
              />
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-1.5"
              />
              <input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-1.5"
              />
            </div>

            <button
              disabled={totals.totalCredits === 0 || !email}
              onClick={() =>
                generateGraduateProposalPDF({
                  graduateName,
                  clientName,
                  email,
                  lines: totals.lines.map(l => ({
                    name: l.assessment.name,
                    qty: l.qty,
                    credits: l.credits,
                  })),
                  totalCredits: totals.totalCredits,
                  costUsd: totals.costUsd,
                  retailUsd: totals.retailUsd,
                  margin: totals.margin,
                  marginPct: totals.marginPct,
                  markup,
                })
              }
              className="w-full text-sm py-2 bg-eq-blue text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" /> Generar propuesta PDF
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              1 crédito = $1 USD. Precio al cliente sugerido — puedes ajustar el
              markup según tu mercado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Category section
// ============================================================
function CategorySection({
  title,
  items,
  cart,
  onAdd,
  onRemove,
  onSet,
}: {
  title: string;
  items: Assessment[];
  cart: Record<string, number>;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onSet: (code: string, val: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map(a => {
            const qty = cart[a.code] ?? 0;
            return (
              <tr
                key={a.code}
                className={`border-t first:border-t-0 ${
                  qty > 0 ? 'bg-eq-cream/30' : ''
                }`}
              >
                <td className="px-4 py-2 w-full">
                  <div className="font-medium text-sm">{a.name}</div>
                  {a.notes && (
                    <div className="text-xs text-muted-foreground">{a.notes}</div>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-muted-foreground">
                  {a.credits} cr
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onRemove(a.code)}
                      disabled={qty === 0}
                      className="w-7 h-7 border rounded hover:bg-gray-50 flex items-center justify-center disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={e => onSet(a.code, Number(e.target.value))}
                      className="w-12 text-center text-sm border rounded py-1"
                    />
                    <button
                      onClick={() => onAdd(a.code)}
                      className="w-7 h-7 border rounded hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
