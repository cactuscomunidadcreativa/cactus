/**
 * AGAVE Types - Sistema configurable por usuario
 * Cada empresa puede tener su propia estructura de datos y reglas de pricing
 */

// Configuración de columnas del Excel del usuario
export interface ColumnMapping {
  // Columnas requeridas
  producto: string;        // Nombre o código del producto
  costoUnitario: string;   // Costo por unidad

  // Columnas opcionales
  precioVenta?: string;    // Precio de venta actual
  cantidad?: string;       // Cantidad vendida
  cliente?: string;        // Nombre del cliente
  fecha?: string;          // Fecha de la transacción
  margen?: string;         // Margen (si ya está calculado)
  categoria?: string;      // Categoría del producto
  proveedor?: string;      // Proveedor

  // Columnas personalizadas
  custom?: Record<string, string>;
}

// Tipos de costo que el usuario puede tener
export type TipoCosto = 'FOB' | 'CIF' | 'DDP' | 'PUESTO_ALMACEN' | 'PUESTO_CLIENTE' | 'CUSTOM';

// Configuración de costos del usuario
export interface CostConfig {
  tipoCostoBase: TipoCosto;

  // Porcentajes adicionales (opcionales)
  porcentajeInternacion?: number;  // % de internación/aduanas
  porcentajeFlete?: number;        // % de flete
  porcentajeAlmacen?: number;      // % de almacenamiento
  porcentajeFinanciero?: number;   // % costo financiero
  porcentajeOtros?: number;        // % otros gastos

  // Moneda
  moneda: 'USD' | 'PEN' | 'EUR' | 'MXN' | 'COP' | 'CLP' | 'ARS';
  tipoCambio?: number;
}

// Rangos de precio personalizables
export interface PriceRange {
  nombre: string;          // "Crítico", "Muy Bajo", "Bajo", etc.
  color: string;           // Color para UI
  margenMinimo: number;    // % margen mínimo para esta categoría
  margenMaximo: number;    // % margen máximo
  comision?: number;       // % comisión vendedor (opcional)
  emoji?: string;          // Emoji para la UI
}

// Configuración completa de una empresa/usuario
export interface AgaveConfig {
  id: string;
  userId: string;
  empresaId?: string;
  nombre: string;

  // Mapeo de columnas
  columnMapping: ColumnMapping;

  // Configuración de costos
  costConfig: CostConfig;

  // Rangos de precio personalizados
  priceRanges: PriceRange[];

  // Objetivo de margen default
  margenObjetivo: number;

  // Reglas personalizadas
  reglas?: PricingRule[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Reglas de pricing personalizadas
export interface PricingRule {
  id: string;
  nombre: string;
  condicion: {
    campo: string;          // "cliente", "cantidad", "producto", etc.
    operador: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    valor: string | number | [number, number];
  };
  accion: {
    tipo: 'descuento' | 'recargo' | 'precio_fijo' | 'margen_minimo';
    valor: number;
  };
  activa: boolean;
}

// Producto con datos del usuario
export interface AgaveProduct {
  id: string;
  codigo?: string;
  nombre: string;

  // Costos (según la configuración del usuario)
  costoBase: number;
  costoFinal: number;  // Después de aplicar %

  // Precios calculados por rango
  precios: Record<string, number>;

  // Histórico (si tiene datos de ventas)
  historico?: {
    cantidadVendida: number;
    precioPromedio: number;
    margenPromedio: number;
    ultimaVenta?: Date;
  };

  // Metadata
  proveedor?: string;
  categoria?: string;
  customFields?: Record<string, any>;
}

// Respuesta de recomendación de precio
export interface PriceRecommendation {
  producto: AgaveProduct;

  // Precios recomendados
  precioMinimo: number;       // Margen mínimo viable
  precioRecomendado: number;  // Según margen objetivo
  precioOptimo: number;       // Margen "Bueno"
  precioPremium: number;      // Margen "Muy Bueno"

  // Categoría actual
  categoriaActual: string;

  // Análisis
  analisis: {
    margenActual?: number;
    comparacionHistorico?: string;
    impactoAnual?: number;
    advertencias?: string[];
    sugerencias?: string[];
  };

  // Simulaciones (si el usuario pregunta "¿qué pasa si...?")
  simulaciones?: PriceSimulation[];
}

export interface PriceSimulation {
  precio: number;
  margen: number;
  categoria: string;
  impactoAnual: number;
  comision?: number;
  comentario: string;
}

// Mensaje del chat
export interface AgaveMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Datos adicionales
  data?: {
    tipo: 'texto' | 'recomendacion' | 'simulacion' | 'configuracion' | 'upload';
    payload?: any;
  };

  // Archivos adjuntos
  attachments?: {
    tipo: 'excel' | 'pdf' | 'imagen' | 'factura';
    nombre: string;
    url?: string;
    datos?: any;
  }[];
}

// Estado de la conversación
export interface AgaveConversation {
  id: string;
  userId: string;
  configId?: string;

  messages: AgaveMessage[];

  // Contexto de la conversación
  contexto: {
    productoActual?: AgaveProduct;
    clienteActual?: string;
    ultimaRecomendacion?: PriceRecommendation;
    datosSubidos?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

// Configuración default para nuevos usuarios
export const DEFAULT_CONFIG: Partial<AgaveConfig> = {
  costConfig: {
    tipoCostoBase: 'CIF',
    moneda: 'USD',
  },
  margenObjetivo: 0.27, // 27%
  priceRanges: [
    { nombre: 'Crítico', color: '#DC2626', margenMinimo: 0, margenMaximo: 0.10, emoji: '🔴' },
    { nombre: 'Muy Bajo', color: '#EA580C', margenMinimo: 0.10, margenMaximo: 0.15, emoji: '🟠' },
    { nombre: 'Bajo', color: '#F59E0B', margenMinimo: 0.15, margenMaximo: 0.20, emoji: '🟡' },
    { nombre: 'Aceptable', color: '#84CC16', margenMinimo: 0.20, margenMaximo: 0.27, emoji: '🟢' },
    { nombre: 'Bueno', color: '#22C55E', margenMinimo: 0.27, margenMaximo: 0.32, emoji: '✅' },
    { nombre: 'Muy Bueno', color: '#14B8A6', margenMinimo: 0.32, margenMaximo: 0.38, emoji: '💚' },
    { nombre: 'Sobresaliente', color: '#0EA5E9', margenMinimo: 0.38, margenMaximo: 0.45, emoji: '💎' },
    { nombre: 'Excelente', color: '#8B5CF6', margenMinimo: 0.45, margenMaximo: 1, emoji: '🏆' },
  ],
};

// Preguntas para configuración inicial
export const SETUP_QUESTIONS = {
  tipoCosto: {
    pregunta: '¿Cómo tienes tus costos? 📦',
    opciones: [
      { valor: 'FOB', label: 'FOB (Free on Board)', descripcion: 'Precio en puerto de origen' },
      { valor: 'CIF', label: 'CIF (Cost, Insurance, Freight)', descripcion: 'Incluye seguro y flete' },
      { valor: 'DDP', label: 'DDP (Delivered Duty Paid)', descripcion: 'Puesto en destino, todo pagado' },
      { valor: 'PUESTO_ALMACEN', label: 'Puesto en almacén', descripcion: 'Ya en tu almacén' },
      { valor: 'PUESTO_CLIENTE', label: 'Puesto en cliente', descripcion: 'Entregado al cliente' },
    ],
  },
  moneda: {
    pregunta: '¿En qué moneda trabajas? 💰',
    opciones: [
      { valor: 'USD', label: 'Dólares (USD)', emoji: '🇺🇸' },
      { valor: 'PEN', label: 'Soles (PEN)', emoji: '🇵🇪' },
      { valor: 'EUR', label: 'Euros (EUR)', emoji: '🇪🇺' },
      { valor: 'MXN', label: 'Pesos Mexicanos (MXN)', emoji: '🇲🇽' },
      { valor: 'COP', label: 'Pesos Colombianos (COP)', emoji: '🇨🇴' },
    ],
  },
  margenObjetivo: {
    pregunta: '¿Cuál es tu margen objetivo? 🎯',
    opciones: [
      { valor: 0.15, label: '15%', descripcion: 'Conservador' },
      { valor: 0.20, label: '20%', descripcion: 'Moderado' },
      { valor: 0.25, label: '25%', descripcion: 'Estándar' },
      { valor: 0.30, label: '30%', descripcion: 'Ambicioso' },
      { valor: 0.35, label: '35%', descripcion: 'Premium' },
    ],
  },
};
