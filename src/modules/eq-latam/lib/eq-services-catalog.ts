/**
 * EQ LATAM — Ad-hoc services catalog.
 *
 * Non-cert offerings that partners can include in proposals to their
 * end clients: 1:1 coaching sessions, team workshops, custom facilitation,
 * post-program follow-up packages.
 *
 * Pricing: 6S Latam sugiere un wholesale + retail; el partner puede
 * override el retail según su mercado.
 */

export type ServiceUnit = 'hour' | 'session' | 'half_day' | 'day' | 'week' | 'package';

export interface AdHocService {
  code: string;
  category: 'coaching' | 'workshop' | 'facilitation' | 'follow_up' | 'consulting';
  name: string;
  unit: ServiceUnit;
  unitLabel: string;
  /** Wholesale a partner (USD por unidad). */
  wholesale_per_unit_usd: number;
  /** Retail sugerido al cliente final (USD por unidad). */
  suggested_retail_per_unit_usd: number;
  description?: string;
}

export const AD_HOC_SERVICES: AdHocService[] = [
  // ===== Coaching 1:1 =====
  {
    code: 'COACH_1H',
    category: 'coaching',
    name: 'Sesión de coaching ejecutivo 1:1',
    unit: 'hour',
    unitLabel: 'por hora',
    wholesale_per_unit_usd: 80,
    suggested_retail_per_unit_usd: 200,
    description: 'Sesión individual de coaching basado en EQ',
  },
  {
    code: 'COACH_10PACK',
    category: 'coaching',
    name: 'Paquete coaching 10 sesiones',
    unit: 'package',
    unitLabel: 'paquete',
    wholesale_per_unit_usd: 700,
    suggested_retail_per_unit_usd: 1750,
    description: '10 sesiones de 1hr c/u con descuento por volumen',
  },

  // ===== Workshops =====
  {
    code: 'WORKSHOP_HALF',
    category: 'workshop',
    name: 'Taller medio día (4h)',
    unit: 'half_day',
    unitLabel: 'medio día',
    wholesale_per_unit_usd: 500,
    suggested_retail_per_unit_usd: 1500,
    description: '4 horas de facilitación grupal — hasta 15 participantes',
  },
  {
    code: 'WORKSHOP_FULL',
    category: 'workshop',
    name: 'Taller día completo (8h)',
    unit: 'day',
    unitLabel: 'día',
    wholesale_per_unit_usd: 900,
    suggested_retail_per_unit_usd: 2800,
    description: 'Día completo de facilitación grupal — hasta 20 participantes',
  },
  {
    code: 'WORKSHOP_WEEK',
    category: 'workshop',
    name: 'Programa semana intensiva (5 días)',
    unit: 'week',
    unitLabel: 'semana',
    wholesale_per_unit_usd: 4200,
    suggested_retail_per_unit_usd: 12500,
    description: '5 días intensivos — bundle con descuento por volumen',
  },

  // ===== Facilitación custom =====
  {
    code: 'FACIL_CUSTOM',
    category: 'facilitation',
    name: 'Facilitación custom (por hora)',
    unit: 'hour',
    unitLabel: 'por hora',
    wholesale_per_unit_usd: 60,
    suggested_retail_per_unit_usd: 150,
    description: 'Facilitación de sesión grupal a medida del cliente',
  },

  // ===== Follow-up =====
  {
    code: 'FOLLOWUP_3M',
    category: 'follow_up',
    name: 'Acompañamiento post-programa 3 meses',
    unit: 'package',
    unitLabel: '3 meses',
    wholesale_per_unit_usd: 1200,
    suggested_retail_per_unit_usd: 3500,
    description: 'Seguimiento mensual del equipo durante 3 meses',
  },
  {
    code: 'FOLLOWUP_6M',
    category: 'follow_up',
    name: 'Acompañamiento post-programa 6 meses',
    unit: 'package',
    unitLabel: '6 meses',
    wholesale_per_unit_usd: 2200,
    suggested_retail_per_unit_usd: 6500,
    description: 'Seguimiento bimensual del equipo durante 6 meses',
  },

  // ===== Consulting =====
  {
    code: 'CONSULT_ASSESS',
    category: 'consulting',
    name: 'Diagnóstico organizacional EQ',
    unit: 'package',
    unitLabel: 'engagement',
    wholesale_per_unit_usd: 1500,
    suggested_retail_per_unit_usd: 5000,
    description: 'Aplicación de TVS/OVS + reporte ejecutivo + recomendaciones',
  },
];

export const SERVICE_CATEGORY_LABELS: Record<AdHocService['category'], string> = {
  coaching:     'Coaching 1:1',
  workshop:     'Talleres grupales',
  facilitation: 'Facilitación custom',
  follow_up:    'Acompañamiento post-programa',
  consulting:   'Consultoría',
};
