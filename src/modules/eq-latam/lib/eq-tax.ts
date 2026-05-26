/**
 * EQ LATAM — Multi-país tax rates.
 *
 * Applied only when 6S Latam (o el partner) factura localmente. Para
 * facturas internacionales el IVA usualmente no aplica.
 */

export type TaxCountry = 'PE' | 'CO' | 'MX' | 'OTHER';

export interface TaxRate {
  country: TaxCountry;
  label: string;
  short: string;       // 'IGV' | 'IVA'
  rate: number;        // 0.18 = 18%
}

export const TAX_RATES: TaxRate[] = [
  { country: 'PE',    label: '🇵🇪 Perú',     short: 'IGV', rate: 0.18 },
  { country: 'CO',    label: '🇨🇴 Colombia', short: 'IVA', rate: 0.19 },
  { country: 'MX',    label: '🇲🇽 México',   short: 'IVA', rate: 0.16 },
  { country: 'OTHER', label: '🌎 Otro / Exento', short: '—', rate: 0 },
];

export function getTaxRate(country: TaxCountry): TaxRate {
  return TAX_RATES.find(t => t.country === country) ?? TAX_RATES[3];
}

export function applyTax(amount: number, country: TaxCountry): {
  base: number;
  tax: number;
  total: number;
} {
  const r = getTaxRate(country);
  const tax = amount * r.rate;
  return { base: amount, tax, total: amount + tax };
}
