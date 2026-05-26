'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import {
  AD_HOC_SERVICES,
  SERVICE_CATEGORY_LABELS,
  type AdHocService,
} from '../lib/eq-services-catalog';
import { formatPriceUSD } from '../lib/eq-pricing-engine';
import type { Partner } from '..';
import { getTierConfig } from '..';

const CATEGORY_ORDER: AdHocService['category'][] = [
  'coaching',
  'workshop',
  'facilitation',
  'follow_up',
  'consulting',
];

/**
 * Ad-hoc services catalog view inside the partner portal.
 * Shows wholesale (partner cost), suggested retail (to client),
 * and lets partner override retail per service line.
 */
export function ServicesCatalogView({ partner }: { partner: Partner }) {
  const tier = getTierConfig(partner.tier);
  // Apply tier discount to wholesale (Elite gets best price, Explorer worst)
  // Note: ad-hoc services use the same tier discount layer as Full EQ Week.
  const tierMultiplier = 1 - (tier.discount_pct - 0.15); // baseline is Explorer at -15%

  const [retailOverrides, setRetailOverrides] = useState<Record<string, number>>({});

  const grouped = AD_HOC_SERVICES.reduce<Record<string, AdHocService[]>>(
    (acc, s) => {
      (acc[s.category] ||= []).push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      <div className="bg-eq-cream/40 border rounded-xl p-4 flex items-start gap-3">
        <Briefcase className="w-5 h-5 text-eq-blue mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">Servicios complementarios</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coaching, talleres, facilitación custom y acompañamiento post-programa.
            Tu wholesale incluye descuento de tier {tier.label}; puedes sugerir el
            retail a tu cliente o ajustarlo según tu mercado.
          </p>
        </div>
      </div>

      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b">
              <h4 className="font-semibold text-sm">{SERVICE_CATEGORY_LABELS[cat]}</h4>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map(s => {
                  const wholesale = s.wholesale_per_unit_usd * tierMultiplier;
                  const retail =
                    retailOverrides[s.code] ?? s.suggested_retail_per_unit_usd;
                  const margin = retail - wholesale;
                  const marginPct = retail > 0 ? margin / retail : 0;
                  return (
                    <tr key={s.code} className="border-t first:border-t-0">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.unitLabel}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                        <div className="text-xs text-muted-foreground">Tu costo</div>
                        <div className="font-medium">
                          {formatPriceUSD(wholesale)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                        <div className="text-xs text-muted-foreground">
                          Tu precio al cliente
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={retail}
                          onChange={e =>
                            setRetailOverrides(prev => ({
                              ...prev,
                              [s.code]: Number(e.target.value),
                            }))
                          }
                          className="w-24 text-right text-sm border rounded px-2 py-1 mt-0.5"
                        />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                        <div className="text-xs text-muted-foreground">Tu margen</div>
                        <div
                          className={`font-medium ${
                            margin >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {formatPriceUSD(margin)}
                          <span className="text-xs ml-1">
                            ({(marginPct * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground text-center">
        Los precios sugeridos son referenciales. Los partners pueden ajustar el
        precio al cliente final según su mercado y la propuesta de valor.
      </p>
    </div>
  );
}
