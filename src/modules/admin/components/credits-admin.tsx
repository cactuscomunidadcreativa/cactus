'use client';

import { MODEL_COSTS, PLAN_CREDITS, CREDIT_USD, MARGIN, usdToCredits } from '@/lib/cactus/credits';

export function CreditsAdmin() {
  const models = Object.entries(MODEL_COSTS);
  const fmt = (n?: number) => (n == null ? '—' : `$${n}`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Créditos y costos</h2>
        <p className="text-sm text-muted-foreground">
          Cómo cada acción de IA se traduce en costo real y en créditos cobrados. Así vender IA siempre deja margen.
        </p>
      </div>

      {/* Fórmula */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="font-display text-xl font-bold">${CREDIT_USD}</div>
          <div className="text-xs text-muted-foreground">1 Crédito Cactus (costo IA cubierto)</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="font-display text-xl font-bold">{Math.round((MARGIN - 1) * 100)}%</div>
          <div className="text-xs text-muted-foreground">Margen sobre el costo IA</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="font-display text-xl font-bold">{usdToCredits(0.01)} créditos</div>
          <div className="text-xs text-muted-foreground">Ejemplo: por $0.01 de costo IA</div>
        </div>
      </div>

      {/* Costos por modelo */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Modelo</th>
              <th className="px-3 py-2 text-right">In /1M</th>
              <th className="px-3 py-2 text-right">Out /1M</th>
              <th className="px-3 py-2 text-right">Imagen</th>
              <th className="px-3 py-2 text-right">Video /seg</th>
            </tr>
          </thead>
          <tbody>
            {models.map(([model, c]) => (
              <tr key={model} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{model}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmt(c.inputPerM)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmt(c.outputPerM)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmt(c.perImage)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmt(c.perVideoSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Planes */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Créditos incluidos por plan / mes</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PLAN_CREDITS).map(([plan, credits]) => (
            <span key={plan} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
              <span className="font-medium capitalize">{plan}</span>
              <span className="ml-2 text-muted-foreground">{credits === -1 ? 'Ilimitado / BYOK' : credits.toLocaleString()}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Estos valores son el espejo de <code className="rounded bg-muted px-1">src/lib/cactus/credits.ts</code> y de la tabla
        <code className="rounded bg-muted px-1">cactus_model_costs</code> (cuando se aplique la migración 031).
      </p>
    </div>
  );
}
