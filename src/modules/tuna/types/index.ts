// ============================================
// TUNA - Sistema de Cierre de Campaña Agrícola
// Tipos y Modelos de Datos
// ============================================

// Campañas
export type CampaignSeason = 'invierno' | 'verano';
export type CampaignYear = number; // e.g., 2024, 2025

export interface Campaign {
  id: string;
  season: CampaignSeason;
  year: CampaignYear;
  name: string; // e.g., "Invierno 2024"
  startDate: Date; // Jul 1 for winter, Jan 1 for summer
  endDate: Date; // Dec 31 for winter, Jun 30 for summer
  status: CampaignStatus;
  totalBudget: number; // USD
  totalActual: number; // USD
  exchangeRate: number; // S/ por USD
  createdAt: Date;
  closedAt?: Date;
}

export type CampaignStatus = 'planning' | 'active' | 'closing' | 'closed';

// Procesos de Producción
export type ProductionProcess = 'almacigo' | 'campo_definitivo' | 'packing';

export interface ProcessBudget {
  process: ProductionProcess;
  budgetUSD: number;
  actualUSD: number;
  variance: number;
  variancePercent: number;
}

// Rubros (Categorías de Gasto)
export interface ExpenseCategory {
  code: string;
  name: string;
  process: ProductionProcess;
  budgetUSD: number;
  actualUSD: number;
  variance: number;
  variancePercent: number;
  monthlyAllocation: MonthlyAllocation[];
}

export interface MonthlyAllocation {
  month: number; // 1-12
  percentage: number; // 0-100
  budgetUSD: number;
  actualUSD: number;
}

// Órdenes de Producción (OP)
export interface ProductionOrder {
  id: string;
  numero: string; // e.g., "OA-112"
  tipo: ProductionOrderType;
  fecha: Date;
  fechaCierre?: Date;
  estado: ProductionOrderStatus;
  codigoProducto: string;
  descripcion: string;

  // Producción
  cantidadEstimada: number;
  cantidadProducida: number;
  diferenciaCantidad: number;

  // Gastos del Período
  gastosPeriodo: ExpenseBreakdown;

  // Gastos Acumulados
  gastosAcumulados: ExpenseBreakdown;

  // Costos
  costoUnitario: number;
  costoTotal: number;

  // Métricas
  horasManoObra: number;
  rendimiento?: number;
}

export type ProductionOrderType = 'A' | 'C' | 'P'; // Almácigo, Campo, Packing
export type ProductionOrderStatus = 'en_proceso' | 'cerrado' | 'cancelado';

export interface ExpenseBreakdown {
  ppInicial: number;
  materiales: number;
  manoObra: number;
  serviciosTerceros: number;
  amortizacion: number;
  otros: number;
  activacion: number; // Negative value
  total: number;
}

// Lotes de Exportación
export interface ExportLot {
  id: string;
  loteId: string; // e.g., "01I2024"
  cantidad: number;
  valorVenta: number;
  costoVenta: number;
  utilidad: number;
  margenUnitario: number;
  margenPercent: number;

  // Varianzas
  varianzaPrecio: number;
  varianzaCosto: number;
  varianzaRendimiento: number;
}

// Unidades de Producción
export interface ProductionUnit {
  id: string;
  name: string; // e.g., "AGRILOR", "SHUMAN"
  tipo: 'convencional' | 'organico';
  hectareas: number;
  rendimientoKgHa: number;
  rendimientoContenedor: number;

  // Costos por Proceso
  costoAlmacigo: ProcessCost;
  costoCampoDefinitivo: ProcessCost;
  costoPacking: ProcessCost;
  costoTotal: number;
}

export interface ProcessCost {
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

// Reportes
export interface CampaignReport {
  campaignId: string;
  generatedAt: Date;
  type: ReportType;
  data: Record<string, unknown>;
  status: 'draft' | 'final';
}

export type ReportType =
  | 'impacto_rendimiento'     // 1ReporteImpactoYRendvs Presup
  | 'resultado_lote'          // 2ResultXLote
  | 'comparativo_rubro'       // 3ComparaXRubro
  | 'gasto_real_presupuesto'  // 4GastoRealVsPresup
  | 'ratios';                 // 5Ratios

// KPIs del Dashboard
export interface CampaignKPIs {
  // Producción
  totalHectareas: number;
  rendimientoPromedio: number; // kg/ha
  produccionTotal: number; // kg

  // Financieros
  presupuestoTotal: number;
  gastoReal: number;
  varianzaTotal: number;
  varianzaPercent: number;

  // Rentabilidad
  ventasTotal: number;
  costoTotal: number;
  utilidadBruta: number;
  margenBruto: number;

  // Eficiencia
  costoUnitarioPromedio: number;
  costoHectareaPromedio: number;
  opsAbiertas: number;
  opsCerradas: number;
}

// Upload de Datos
export interface DataUpload {
  id: string;
  fileName: string;
  fileType: 'excel' | 'csv' | 'pdf';
  uploadedAt: Date;
  processedAt?: Date;
  status: UploadStatus;
  dataType: DataType;
  recordsProcessed: number;
  errors: UploadError[];
}

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DataType = 'presupuesto' | 'gastos_op' | 'produccion' | 'ventas';

export interface UploadError {
  row: number;
  column: string;
  message: string;
  severity: 'warning' | 'error';
}

// Reglas del Motor
export interface BusinessRule {
  id: string;
  name: string;
  category: RuleCategory;
  description: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

export type RuleCategory =
  | 'campaign'    // Reglas de campaña (julio-junio)
  | 'conversion'  // Reglas de conversión monetaria
  | 'validation'  // Reglas de validación (cierre contable)
  | 'alert';      // Reglas de alerta (%)

// Alertas
export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedEntity?: string; // OP number, Lot ID, etc.
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export type AlertType =
  | 'cost_overrun'        // Costo fuera de rango
  | 'negative_margin'     // Margen negativo
  | 'unusual_variance'    // Variación inusual
  | 'data_quality'        // Problema de calidad de datos
  | 'deadline_approaching'; // Fecha límite acercándose

// Roles y Permisos
export type TunaRole = 'produccion' | 'costos' | 'ventas' | 'finanzas' | 'gerencia';

export interface TunaUser {
  id: string;
  name: string;
  email: string;
  role: TunaRole;
  canUpload: DataType[];
  canView: ReportType[];
  canClose: boolean;
}

// Estado del Store
export interface TunaState {
  // Campaign activa
  activeCampaign: Campaign | null;
  campaigns: Campaign[];

  // Datos
  productionOrders: ProductionOrder[];
  exportLots: ExportLot[];
  productionUnits: ProductionUnit[];
  expenseCategories: ExpenseCategory[];

  // KPIs y Reportes
  kpis: CampaignKPIs | null;
  reports: CampaignReport[];

  // UI State
  uploads: DataUpload[];
  alerts: Alert[];
  isProcessing: boolean;
  lastSync: Date | null;
}
