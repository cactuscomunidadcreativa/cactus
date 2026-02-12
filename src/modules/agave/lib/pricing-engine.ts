/**
 * AGAVE Pricing Engine - Pure calculations (NO AI)
 * All price calculations are done mathematically, not with AI
 */

// Margin range definition
export interface MarginRange {
  nombre: string;
  min: number;
  max: number;
  color: string;
}

// Default margin ranges
export const DEFAULT_MARGIN_RANGES: MarginRange[] = [
  { nombre: 'Critico', min: 0, max: 0.10, color: '#DC2626' },
  { nombre: 'Muy Bajo', min: 0.10, max: 0.15, color: '#EA580C' },
  { nombre: 'Bajo', min: 0.15, max: 0.20, color: '#F59E0B' },
  { nombre: 'Aceptable', min: 0.20, max: 0.27, color: '#84CC16' },
  { nombre: 'Bueno', min: 0.27, max: 0.32, color: '#22C55E' },
  { nombre: 'Muy Bueno', min: 0.32, max: 0.38, color: '#14B8A6' },
  { nombre: 'Sobresaliente', min: 0.38, max: 0.45, color: '#0EA5E9' },
  { nombre: 'Excelente', min: 0.45, max: 1, color: '#8B5CF6' },
];

// Price calculation result
export interface PriceCalculation {
  costo: number;
  precioMinimo: number;      // At "Aceptable" margin (20%)
  precioRecomendado: number; // At target margin
  precioOptimo: number;      // At "Bueno" margin (27%)
  precioPremium: number;     // At "Muy Bueno" margin (32%)
  preciosByCategory: Record<string, number>;
  margenObjetivo: number;
  categoriaObjetivo: string;
}

// Simulation result
export interface SimulationResult {
  precioOriginal: number;
  precioConDescuento: number;
  descuentoPorcentaje: number;
  margenResultante: number;
  categoriaResultante: string;
  colorCategoria: string;
  impactoAnual: number;
  ventasMensuales: number;
  recomendacion: string;
}

// Classification result
export interface MarginClassification {
  margen: number;
  categoria: string;
  color: string;
  siguiente?: { categoria: string; precioNecesario: number };
}

/**
 * Calculate price from cost and margin
 * Formula: Precio = Costo / (1 - Margen)
 */
export function calcularPrecio(costo: number, margen: number): number {
  if (margen >= 1) return Infinity;
  if (margen < 0) margen = 0;
  return Math.round((costo / (1 - margen)) * 100) / 100;
}

/**
 * Calculate margin from price and cost
 * Formula: Margen = (Precio - Costo) / Precio
 */
export function calcularMargen(precio: number, costo: number): number {
  if (precio <= 0) return 0;
  return Math.round(((precio - costo) / precio) * 10000) / 10000;
}

/**
 * Calculate cost from price and margin
 * Formula: Costo = Precio * (1 - Margen)
 */
export function calcularCosto(precio: number, margen: number): number {
  if (margen >= 1) return 0;
  return Math.round((precio * (1 - margen)) * 100) / 100;
}

/**
 * Get all prices by category for a given cost
 */
export function calcularPreciosPorCategoria(
  costo: number,
  rangos: MarginRange[] = DEFAULT_MARGIN_RANGES
): Record<string, number> {
  const precios: Record<string, number> = {};

  for (const rango of rangos) {
    // Use the max margin of each range for the price
    precios[rango.nombre.toLowerCase()] = calcularPrecio(costo, rango.max);
  }

  return precios;
}

/**
 * Classify a price/margin into a category
 */
export function clasificarMargen(
  margen: number,
  rangos: MarginRange[] = DEFAULT_MARGIN_RANGES
): MarginClassification {
  // Sort ranges by min to ensure proper order
  const sortedRangos = [...rangos].sort((a, b) => a.min - b.min);

  for (let i = 0; i < sortedRangos.length; i++) {
    const rango = sortedRangos[i];
    if (margen >= rango.min && margen < rango.max) {
      const result: MarginClassification = {
        margen,
        categoria: rango.nombre,
        color: rango.color,
      };

      // If not the highest category, suggest next level
      if (i < sortedRangos.length - 1) {
        const siguiente = sortedRangos[i + 1];
        result.siguiente = {
          categoria: siguiente.nombre,
          precioNecesario: 0, // Will be calculated by caller
        };
      }

      return result;
    }
  }

  // If margin is >= max of last range, it's in the last category
  const lastRange = sortedRangos[sortedRangos.length - 1];
  if (margen >= lastRange.max) {
    return {
      margen,
      categoria: lastRange.nombre,
      color: lastRange.color,
    };
  }

  // Default to first category if below all ranges
  return {
    margen,
    categoria: sortedRangos[0].nombre,
    color: sortedRangos[0].color,
  };
}

/**
 * Classify a price based on cost
 */
export function clasificarPrecio(
  precio: number,
  costo: number,
  rangos: MarginRange[] = DEFAULT_MARGIN_RANGES
): MarginClassification {
  const margen = calcularMargen(precio, costo);
  const classification = clasificarMargen(margen, rangos);

  // Calculate price needed for next category
  if (classification.siguiente) {
    const siguienteRango = rangos.find(
      r => r.nombre === classification.siguiente!.categoria
    );
    if (siguienteRango) {
      classification.siguiente.precioNecesario = calcularPrecio(
        costo,
        siguienteRango.min
      );
    }
  }

  return classification;
}

/**
 * Full price calculation for a product
 */
export function calcularPrecioCompleto(
  costo: number,
  margenObjetivo: number = 0.27,
  rangos: MarginRange[] = DEFAULT_MARGIN_RANGES
): PriceCalculation {
  const preciosByCategory = calcularPreciosPorCategoria(costo, rangos);

  // Find the range that contains the target margin
  const rangoObjetivo = rangos.find(
    r => margenObjetivo >= r.min && margenObjetivo < r.max
  ) || rangos.find(r => r.nombre === 'Bueno') || rangos[4];

  return {
    costo,
    precioMinimo: preciosByCategory['aceptable'] || calcularPrecio(costo, 0.20),
    precioRecomendado: calcularPrecio(costo, margenObjetivo),
    precioOptimo: preciosByCategory['bueno'] || calcularPrecio(costo, 0.27),
    precioPremium: preciosByCategory['muy bueno'] || calcularPrecio(costo, 0.32),
    preciosByCategory,
    margenObjetivo,
    categoriaObjetivo: rangoObjetivo.nombre,
  };
}

/**
 * Simulate a discount scenario
 */
export function simularDescuento(
  precioOriginal: number,
  costo: number,
  descuentoPorcentaje: number,
  ventasMensuales: number = 0,
  rangos: MarginRange[] = DEFAULT_MARGIN_RANGES
): SimulationResult {
  const descuentoDecimal = descuentoPorcentaje / 100;
  const precioConDescuento = Math.round(precioOriginal * (1 - descuentoDecimal) * 100) / 100;
  const margenOriginal = calcularMargen(precioOriginal, costo);
  const margenResultante = calcularMargen(precioConDescuento, costo);
  const clasificacion = clasificarMargen(margenResultante, rangos);

  // Calculate annual impact
  const utilidadOriginal = (precioOriginal - costo) * ventasMensuales * 12;
  const utilidadNueva = (precioConDescuento - costo) * ventasMensuales * 12;
  const impactoAnual = Math.round(utilidadNueva - utilidadOriginal);

  // Generate recommendation
  let recomendacion: string;
  if (margenResultante < 0.10) {
    recomendacion = 'NO RECOMENDADO - Margen critico';
  } else if (margenResultante < 0.15) {
    recomendacion = 'PRECAUCION - Margen muy bajo';
  } else if (margenResultante < 0.20) {
    recomendacion = 'ACEPTABLE SOLO para volumen alto';
  } else if (margenResultante >= margenOriginal * 0.9) {
    recomendacion = 'APROBADO - Margen saludable';
  } else {
    recomendacion = 'EVALUAR - Descuento significativo';
  }

  return {
    precioOriginal,
    precioConDescuento,
    descuentoPorcentaje,
    margenResultante: Math.round(margenResultante * 10000) / 100, // As percentage
    categoriaResultante: clasificacion.categoria,
    colorCategoria: clasificacion.color,
    impactoAnual,
    ventasMensuales,
    recomendacion,
  };
}

/**
 * Calculate breakeven price (margin = 0)
 */
export function calcularPuntoEquilibrio(costo: number): number {
  return costo;
}

/**
 * Calculate the discount percentage to reach a target price
 */
export function calcularDescuentoParaPrecio(
  precioOriginal: number,
  precioObjetivo: number
): number {
  if (precioOriginal <= 0) return 0;
  const descuento = ((precioOriginal - precioObjetivo) / precioOriginal) * 100;
  return Math.round(descuento * 100) / 100;
}

/**
 * Find the best price for a target annual profit
 */
export function calcularPrecioParaUtilidad(
  costo: number,
  utilidadAnualObjetivo: number,
  ventasMensuales: number
): number {
  if (ventasMensuales <= 0) return 0;
  const ventasAnuales = ventasMensuales * 12;
  const utilidadPorUnidad = utilidadAnualObjetivo / ventasAnuales;
  return Math.round((costo + utilidadPorUnidad) * 100) / 100;
}

/**
 * Format price for display
 */
export function formatearPrecio(
  precio: number,
  moneda: string = 'USD',
  decimales: number = 2
): string {
  const simbolos: Record<string, string> = {
    USD: '$',
    PEN: 'S/',
    EUR: '€',
    MXN: '$',
    COP: '$',
    CLP: '$',
    ARS: '$',
  };

  const simbolo = simbolos[moneda] || '$';
  return `${simbolo}${precio.toFixed(decimales)}`;
}

/**
 * Format percentage for display
 */
export function formatearPorcentaje(valor: number, decimales: number = 1): string {
  // If value is already a percentage (e.g., 27), use as is
  // If value is a decimal (e.g., 0.27), multiply by 100
  const porcentaje = valor < 1 ? valor * 100 : valor;
  return `${porcentaje.toFixed(decimales)}%`;
}

/**
 * Get emoji for category
 */
export function getEmojiForCategory(categoria: string): string {
  const emojis: Record<string, string> = {
    'critico': '🔴',
    'muy bajo': '🟠',
    'bajo': '🟡',
    'aceptable': '🟢',
    'bueno': '✅',
    'muy bueno': '💚',
    'sobresaliente': '💎',
    'excelente': '🏆',
  };

  return emojis[categoria.toLowerCase()] || '⚪';
}

/**
 * Compare two prices and return analysis
 */
export function compararPrecios(
  precioActual: number,
  precioNuevo: number,
  costo: number
): {
  diferencia: number;
  porcentajeCambio: number;
  margenActual: number;
  margenNuevo: number;
  mejora: boolean;
} {
  const diferencia = precioNuevo - precioActual;
  const porcentajeCambio = precioActual > 0
    ? Math.round(((precioNuevo - precioActual) / precioActual) * 10000) / 100
    : 0;

  return {
    diferencia: Math.round(diferencia * 100) / 100,
    porcentajeCambio,
    margenActual: calcularMargen(precioActual, costo),
    margenNuevo: calcularMargen(precioNuevo, costo),
    mejora: precioNuevo > precioActual,
  };
}
