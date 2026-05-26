import { GraduateCalculator } from '@/modules/eq-latam/components/graduate-calculator';

export const metadata = {
  title: 'Six Seconds Latam · Calculadora para Practitioners',
  description:
    'Cotiza tu engagement de Inteligencia Emocional con créditos Six Seconds. Versión Latam.',
};

/**
 * Public Graduate calculator. No auth required.
 *
 * Route: /eq-latam/calc — mirrors the structure of 6sec.org/calc with
 * Latam-localized pricing, currency, and PDF proposal generation.
 */
export default function EqLatamCalcPage() {
  return <GraduateCalculator />;
}
