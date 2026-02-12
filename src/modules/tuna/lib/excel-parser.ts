import * as XLSX from 'xlsx';
import type {
  ProductionOrder,
  ExpenseCategory,
  Campaign,
  CampaignKPIs,
  ProductionProcess,
  ExpenseBreakdown,
} from '../types';

// ============================================
// Excel Parser para TUNA
// Procesa los archivos de campaña agrícola
// ============================================

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: { row?: number; column?: string; message: string }[];
  warnings: { row?: number; column?: string; message: string }[];
  summary: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
  };
  // Optional EEFF totals for gastos_op parsing
  eeffTotals?: Record<string, { total: number; almacigo: number; campo: number; packing: number }>;
}

// Parse el archivo de Presupuesto - Soporta múltiples formatos
export function parsePresupuesto(buffer: ArrayBuffer): ParseResult<{
  budget: { process: ProductionProcess; amount: number }[];
  categories: ExpenseCategory[];
  exchangeRate: number;
}> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: ParseResult<unknown>['errors'] = [];
  const warnings: ParseResult<unknown>['warnings'] = [];

  try {
    // Detectar formato del archivo
    const hasPresupuestoBase = !!workbook.Sheets['PRESUPUESTO_BASE'];
    const hasCostoSheet = workbook.SheetNames.some(name =>
      name.toLowerCase().includes('costo') || name.toLowerCase().includes('has')
    );

    if (hasPresupuestoBase) {
      // Formato Tablero (AvancePresupuestDobleCampañaTABLERO.xlsx)
      return parsePresupuestoTablero(workbook, errors, warnings);
    } else if (hasCostoSheet) {
      // Formato Data Presupuesto (Data Presupuesto.xlsx)
      return parsePresupuestoData(workbook, errors, warnings);
    } else {
      // Intentar parsear la primera hoja como formato genérico
      return parsePresupuestoGeneric(workbook, errors, warnings);
    }
  } catch (error) {
    errors.push({ message: `Error al procesar archivo: ${error}` });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  }
}

// Parser para formato Tablero (PRESUPUESTO_BASE)
function parsePresupuestoTablero(
  workbook: XLSX.WorkBook,
  errors: ParseResult<unknown>['errors'],
  warnings: ParseResult<unknown>['warnings']
): ParseResult<{
  budget: { process: ProductionProcess; amount: number }[];
  categories: ExpenseCategory[];
  exchangeRate: number;
}> {
  const budgetSheet = workbook.Sheets['PRESUPUESTO_BASE'];
  if (!budgetSheet) {
    errors.push({ message: 'No se encontró la hoja PRESUPUESTO_BASE' });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  }

  const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1 }) as unknown[][];
  const budget: { process: ProductionProcess; amount: number }[] = [];
  const categories: ExpenseCategory[] = [];

  // Buscar tipo de cambio en TABLERO
  let exchangeRate = 3.8;
  const tableroSheet = workbook.Sheets['TABLERO'];
  if (tableroSheet) {
    const tableroData = XLSX.utils.sheet_to_json(tableroSheet, { header: 1 }) as unknown[][];
    for (const row of tableroData) {
      for (let i = 0; i < row.length; i++) {
        if (String(row[i]).includes('TC') && typeof row[i + 1] === 'number') {
          exchangeRate = row[i + 1] as number;
          break;
        }
      }
    }
  }

  let totalRows = 0;
  let processedRows = 0;

  for (let i = 1; i < budgetData.length; i++) {
    const row = budgetData[i];
    if (!row || row.length === 0) continue;
    totalRows++;

    const rubro = String(row[0] || '').trim();
    const proceso = String(row[1] || '').toLowerCase().trim();
    const amount = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]) || '0');

    if (!rubro || isNaN(amount)) {
      warnings.push({ row: i + 1, message: `Fila ignorada: datos incompletos` });
      continue;
    }

    let mappedProcess: ProductionProcess = 'campo_definitivo';
    if (proceso.includes('almacigo') || proceso.includes('almácigo')) {
      mappedProcess = 'almacigo';
    } else if (proceso.includes('packing')) {
      mappedProcess = 'packing';
    }

    categories.push({
      code: `CAT-${i}`,
      name: rubro,
      process: mappedProcess,
      budgetUSD: amount,
      actualUSD: 0,
      variance: 0,
      variancePercent: 0,
      monthlyAllocation: [],
    });

    processedRows++;
  }

  const processGroups = categories.reduce((acc, cat) => {
    if (!acc[cat.process]) acc[cat.process] = 0;
    acc[cat.process] += cat.budgetUSD;
    return acc;
  }, {} as Record<ProductionProcess, number>);

  for (const [process, amount] of Object.entries(processGroups)) {
    budget.push({ process: process as ProductionProcess, amount });
  }

  return {
    success: categories.length > 0,
    data: { budget, categories, exchangeRate },
    errors,
    warnings,
    summary: { totalRows, processedRows, skippedRows: totalRows - processedRows },
  };
}

// Parser para formato Data Presupuesto (Costo X HAS)
function parsePresupuestoData(
  workbook: XLSX.WorkBook,
  errors: ParseResult<unknown>['errors'],
  warnings: ParseResult<unknown>['warnings']
): ParseResult<{
  budget: { process: ProductionProcess; amount: number }[];
  categories: ExpenseCategory[];
  exchangeRate: number;
}> {
  // Encontrar la hoja de costos
  const sheetName = workbook.SheetNames.find(name =>
    name.toLowerCase().includes('costo') || name.toLowerCase().includes('has')
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  const budget: { process: ProductionProcess; amount: number }[] = [];
  const categories: ExpenseCategory[] = [];

  // Buscar tipo de cambio (TC) en las primeras filas
  let exchangeRate = 3.7; // Default para este formato
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '');
      if (cell === 'TC' && typeof row[j + 1] === 'number') {
        exchangeRate = row[j + 1] as number;
        break;
      }
    }
  }

  // Encontrar la fila de headers y la columna TOTAL COST (columna M = índice 12)
  let headerRow = -1;
  let totalCostCol = -1;

  // Buscar en las primeras 15 filas el header "TOTAL COST" o similar
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      // Buscar columna TOTAL COST o TOTAL (típicamente columna M en este formato)
      if (cell.includes('total cost') || cell.includes('total_cost') ||
          (cell === 'total' && j >= 10)) { // Solo "total" si está después de columna J
        headerRow = i;
        totalCostCol = j;
        break;
      }
    }
    if (headerRow >= 0) break;
  }

  // Si no encontramos headers específicos, usar valores por defecto
  // En el formato "Costo 481 HAS", el header está en fila 9 (índice 8) y TOTAL en columna M (índice 12)
  if (headerRow < 0) {
    headerRow = 8;
    totalCostCol = 12; // Columna M
  }

  console.log(`Parser: headerRow=${headerRow}, totalCostCol=${totalCostCol}`);

  let totalRows = 0;
  let processedRows = 0;
  let currentProcess: ProductionProcess = 'almacigo';

  // Procesar filas de datos
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const codeCell = String(row[0] || '').trim();
    const nameCell = String(row[1] || '').trim();

    // Detectar cambio de proceso basado en código o nombre
    if (codeCell.match(/^[A-D]\)/i)) {
      const combinedName = (codeCell + ' ' + nameCell).toLowerCase();
      if (combinedName.includes('almacigo') || combinedName.includes('almácigo') || codeCell.toLowerCase() === 'a)') {
        currentProcess = 'almacigo';
      } else if (combinedName.includes('campo') || codeCell.toLowerCase() === 'b)') {
        currentProcess = 'campo_definitivo';
      } else if (combinedName.includes('packing') || codeCell.toLowerCase() === 'c)') {
        currentProcess = 'packing';
      } else if (combinedName.includes('gasto') || combinedName.includes('fijo') || codeCell.toLowerCase() === 'd)') {
        // D) GASTOS FIJOS - mantener como categoría separada bajo packing
        currentProcess = 'packing';
      }
      continue;
    }

    // Ignorar filas de totales generales y headers
    const codeLower = codeCell.toLowerCase();
    if (!codeCell ||
        codeLower === 'total general' ||
        codeLower === 'subtotal' ||
        codeLower === 'rubro' ||
        codeLower === 'gran total') {
      continue;
    }

    // Permitir filas con código numérico como "15.-", "18.-", etc.
    // Solo ignorar números puros sin guión
    if (codeCell.match(/^[0-9]+$/) && !codeCell.includes('.') && !codeCell.includes('-')) {
      continue;
    }

    totalRows++;

    // Buscar el valor de costo total - PRIORIZAR columna TOTAL (M)
    let amount = 0;

    // 1. Primero intentar columna TOTAL COST identificada (columna M)
    if (totalCostCol >= 0 && totalCostCol < row.length) {
      amount = parseNumber(row[totalCostCol]);
    }

    // 2. Si no hay valor en TOTAL, buscar desde el final hacia atrás (columnas con totales suelen estar al final)
    if (amount === 0) {
      for (let j = Math.min(row.length - 1, 15); j >= 2; j--) {
        const val = parseNumber(row[j]);
        if (val > 0) {
          amount = val;
          break;
        }
      }
    }

    // 3. Si aún no hay valor, buscar cualquier número en la fila
    if (amount === 0) {
      for (let j = 2; j < row.length; j++) {
        const val = parseNumber(row[j]);
        if (val > 0) {
          amount = val;
          break;
        }
      }
    }

    if (amount > 0) {
      // Usar el nombre de columna 1 si existe, de lo contrario usar el código
      const categoryName = nameCell || codeCell;

      categories.push({
        code: codeCell,
        name: categoryName,
        process: currentProcess,
        budgetUSD: amount,
        actualUSD: 0,
        variance: 0,
        variancePercent: 0,
        monthlyAllocation: [],
      });
      processedRows++;
    } else {
      warnings.push({ row: i + 1, message: `Fila ignorada: sin monto válido` });
    }
  }

  // Agregar totales por proceso
  const processGroups = categories.reduce((acc, cat) => {
    if (!acc[cat.process]) acc[cat.process] = 0;
    acc[cat.process] += cat.budgetUSD;
    return acc;
  }, {} as Record<ProductionProcess, number>);

  for (const [process, amount] of Object.entries(processGroups)) {
    budget.push({ process: process as ProductionProcess, amount });
  }

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgetUSD, 0);
  console.log(`Parser: Total budget calculated: $${totalBudget.toLocaleString()}, Categories: ${categories.length}`);

  return {
    success: categories.length > 0,
    data: { budget, categories, exchangeRate },
    errors,
    warnings,
    summary: { totalRows, processedRows, skippedRows: totalRows - processedRows },
  };
}

// Parser genérico para otros formatos de presupuesto
function parsePresupuestoGeneric(
  workbook: XLSX.WorkBook,
  errors: ParseResult<unknown>['errors'],
  warnings: ParseResult<unknown>['warnings']
): ParseResult<{
  budget: { process: ProductionProcess; amount: number }[];
  categories: ExpenseCategory[];
  exchangeRate: number;
}> {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  const budget: { process: ProductionProcess; amount: number }[] = [];
  const categories: ExpenseCategory[] = [];
  let exchangeRate = 3.8;

  let totalRows = 0;
  let processedRows = 0;

  // Buscar filas con datos de presupuesto
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const codeCell = String(row[0] || '').trim();
    const nameCell = String(row[1] || '').trim();
    if (!codeCell || codeCell.length < 1) continue;

    // Buscar un número en las siguientes columnas (empezando desde col 2)
    let amount = 0;
    for (let j = 2; j < Math.min(row.length, 10); j++) {
      const val = parseNumber(row[j]);
      if (val > 0) {
        amount = val;
        break;
      }
    }

    if (amount > 0) {
      totalRows++;
      // Usar el nombre de columna 1 si existe, de lo contrario usar el código
      const categoryName = nameCell || codeCell;

      categories.push({
        code: codeCell,
        name: categoryName,
        process: 'campo_definitivo',
        budgetUSD: amount,
        actualUSD: 0,
        variance: 0,
        variancePercent: 0,
        monthlyAllocation: [],
      });
      processedRows++;
    }
  }

  // Calcular totales
  const total = categories.reduce((sum, cat) => sum + cat.budgetUSD, 0);
  budget.push({ process: 'campo_definitivo', amount: total });

  if (categories.length === 0) {
    errors.push({ message: 'No se encontraron datos de presupuesto en el archivo' });
  }

  return {
    success: categories.length > 0,
    data: { budget, categories, exchangeRate },
    errors,
    warnings,
    summary: { totalRows, processedRows, skippedRows: totalRows - processedRows },
  };
}

// Parse el archivo de Gastos por OP - Soporta múltiples formatos
export function parseGastosOP(buffer: ArrayBuffer): ParseResult<ProductionOrder[]> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: ParseResult<unknown>['errors'] = [];
  const warnings: ParseResult<unknown>['warnings'] = [];

  try {
    // Detectar formato del archivo
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    if (data.length === 0) {
      errors.push({ message: 'El archivo está vacío' });
      return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
    }

    // Detectar formato matriz (EEFF - Orden Trabajo)
    // Características: headers contienen patrones como OA_*, OK_*, OP_*
    const firstRow = data[0] || [];
    const hasMatrixFormat = firstRow.some((cell) => {
      const cellStr = String(cell || '');
      return /^O[AKP]_\d+/.test(cellStr) || cellStr === 'Descripción' || cellStr.includes('T_ALMACIGOS');
    });

    if (hasMatrixFormat) {
      return parseGastosOPMatriz(workbook, data, errors, warnings);
    } else {
      return parseGastosOPLista(workbook, data, errors, warnings);
    }
  } catch (error) {
    errors.push({ message: `Error al procesar archivo: ${error}` });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  }
}

// Parser para formato matriz (EEFF - Orden Trabajo)
function parseGastosOPMatriz(
  workbook: XLSX.WorkBook,
  data: unknown[][],
  errors: ParseResult<unknown>['errors'],
  warnings: ParseResult<unknown>['warnings']
): ParseResult<ProductionOrder[]> {
  const orders: ProductionOrder[] = [];
  const headers = data[0] as string[];

  // Encontrar columnas de OPs (OA_*, OK_*, OP_*) y ignorar totales (T_*)
  interface OPColumn {
    index: number;
    numero: string;
    tipo: 'A' | 'C' | 'P';
  }

  const opColumns: OPColumn[] = [];

  headers.forEach((header, idx) => {
    const headerStr = String(header || '').trim();

    // Detectar OA_ (Almácigo), OK_ (Campo), OP_ (Packing)
    if (/^OA_\d+/.test(headerStr)) {
      opColumns.push({ index: idx, numero: headerStr, tipo: 'A' });
    } else if (/^OK_\d+/.test(headerStr)) {
      opColumns.push({ index: idx, numero: headerStr, tipo: 'C' });
    } else if (/^OP_\d+/.test(headerStr)) {
      opColumns.push({ index: idx, numero: headerStr, tipo: 'P' });
    }
    // Ignorar T_* (totales) y otras columnas
  });

  if (opColumns.length === 0) {
    errors.push({ message: 'No se encontraron columnas de Órdenes de Producción (OA_*, OK_*, OP_*)' });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  }

  // Encontrar índice de columna Descripción
  const descColIndex = headers.findIndex((h) =>
    String(h || '').toLowerCase() === 'descripción' || String(h || '').toLowerCase() === 'descripcion'
  );

  // Crear mapa de rubros (descripción -> valores por OP)
  interface RubroData {
    descripcion: string;
    valores: Record<number, number>; // índice de columna -> valor
  }

  const rubros: RubroData[] = [];

  // Procesar filas de datos (empezar desde fila 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const descripcion = descColIndex >= 0 ? String(row[descColIndex] || '').trim() : String(row[1] || '').trim();

    // Ignorar filas de encabezado o vacías
    if (!descripcion || descripcion === 'DIRECTO' || descripcion === 'INDIRECTO') continue;

    const valores: Record<number, number> = {};
    opColumns.forEach((op) => {
      const val = parseNumber(row[op.index]);
      if (val > 0) {
        valores[op.index] = val;
      }
    });

    if (Object.keys(valores).length > 0) {
      rubros.push({ descripcion, valores });
    }
  }

  // Crear ProductionOrder por cada columna de OP
  let processedRows = 0;

  for (const op of opColumns) {
    // Calcular total de gastos para esta OP
    let costoTotal = 0;
    const gastosDetalle: Record<string, number> = {};

    rubros.forEach((rubro) => {
      const valor = rubro.valores[op.index] || 0;
      if (valor > 0) {
        costoTotal += valor;
        gastosDetalle[rubro.descripcion] = valor;
      }
    });

    // Solo crear OP si tiene gastos
    if (costoTotal > 0) {
      // Guardar TODOS los conceptos de gasto detallados (para mapeo con IA)
      const gastosDetalladosConTotal = {
        ...gastosDetalle,
        total: costoTotal,
      };

      const order: ProductionOrder = {
        id: `OP-${op.numero}`,
        numero: op.numero,
        tipo: op.tipo,
        fecha: new Date(),
        estado: 'en_proceso',
        codigoProducto: '',
        descripcion: `Orden ${op.tipo === 'A' ? 'Almácigo' : op.tipo === 'C' ? 'Campo' : 'Packing'} - ${op.numero}`,
        cantidadEstimada: 0,
        cantidadProducida: 0,
        diferenciaCantidad: 0,
        // Guardar todos los conceptos detallados para el mapeo con IA
        gastosPeriodo: gastosDetalladosConTotal as unknown as ProductionOrder['gastosPeriodo'],
        gastosAcumulados: {
          ppInicial: 0,
          materiales: 0,
          manoObra: 0,
          serviciosTerceros: 0,
          amortizacion: 0,
          otros: 0,
          activacion: 0,
          total: costoTotal,
        },
        costoUnitario: 0,
        costoTotal,
        horasManoObra: 0,
      };

      orders.push(order);
      processedRows++;
    }
  }

  // Calcular totales por concepto EEFF (para la tabla tuna_eeff_totals)
  const eeffTotals: Record<string, { total: number; almacigo: number; campo: number; packing: number }> = {};

  for (const op of opColumns) {
    const tipo = op.tipo; // 'A', 'C', 'P'

    rubros.forEach((rubro) => {
      const valor = rubro.valores[op.index] || 0;
      if (valor > 0) {
        if (!eeffTotals[rubro.descripcion]) {
          eeffTotals[rubro.descripcion] = { total: 0, almacigo: 0, campo: 0, packing: 0 };
        }
        eeffTotals[rubro.descripcion].total += valor;
        if (tipo === 'A') eeffTotals[rubro.descripcion].almacigo += valor;
        else if (tipo === 'C') eeffTotals[rubro.descripcion].campo += valor;
        else if (tipo === 'P') eeffTotals[rubro.descripcion].packing += valor;
      }
    });
  }

  return {
    success: orders.length > 0,
    data: orders,
    eeffTotals, // Exportar totales por concepto para guardar en DB
    errors,
    warnings,
    summary: {
      totalRows: opColumns.length,
      processedRows,
      skippedRows: opColumns.length - processedRows,
    },
  };
}

// Parser para formato lista (ReporteDeGastoXOP.xlsx) - formato original
function parseGastosOPLista(
  workbook: XLSX.WorkBook,
  data: unknown[][],
  errors: ParseResult<unknown>['errors'],
  warnings: ParseResult<unknown>['warnings']
): ParseResult<ProductionOrder[]> {
  const orders: ProductionOrder[] = [];

  // Encontrar la fila de headers
  let headerRow = 0;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.some((cell) => String(cell).toLowerCase().includes('número') || String(cell).toLowerCase().includes('numero'))) {
      headerRow = i;
      break;
    }
  }

  const headers = data[headerRow] as string[];

  // Mapear índices de columnas
  const colMap: Record<string, number> = {};
  headers.forEach((header, idx) => {
    const h = String(header || '').toLowerCase().trim();
    if (h.includes('número') || h.includes('numero')) colMap['numero'] = idx;
    if (h.includes('fecha') && !h.includes('cierre')) colMap['fecha'] = idx;
    if (h.includes('cierre')) colMap['fechaCierre'] = idx;
    if (h.includes('tipo')) colMap['tipo'] = idx;
    if (h.includes('estado')) colMap['estado'] = idx;
    if (h.includes('código') || h.includes('codigo')) colMap['codigo'] = idx;
    if (h.includes('descripción') || h.includes('descripcion')) colMap['descripcion'] = idx;
    if (h.includes('estimad')) colMap['estimada'] = idx;
    if (h.includes('producid')) colMap['producida'] = idx;
    if (h.includes('diferencia')) colMap['diferencia'] = idx;
    if (h.includes('material')) colMap['materiales'] = idx;
    if (h.includes('mano') && h.includes('obra')) colMap['manoObra'] = idx;
    if (h.includes('servicio')) colMap['servicios'] = idx;
    if (h.includes('total') && h.includes('gasto')) colMap['totalGasto'] = idx;
    if (h.includes('costo') && h.includes('unit')) colMap['costoUnitario'] = idx;
    if (h.includes('horas')) colMap['horas'] = idx;
  });

  let totalRows = 0;
  let processedRows = 0;

  // Procesar filas de datos
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const numero = String(row[colMap['numero']] || '').trim();
    if (!numero || numero.length < 2) continue;

    totalRows++;

    try {
      const order: ProductionOrder = {
        id: `OP-${i}`,
        numero,
        tipo: (String(row[colMap['tipo']] || 'C').charAt(0).toUpperCase() as 'A' | 'C' | 'P'),
        fecha: parseExcelDate(row[colMap['fecha']]),
        fechaCierre: row[colMap['fechaCierre']] ? parseExcelDate(row[colMap['fechaCierre']]) : undefined,
        estado: String(row[colMap['estado']] || '').toLowerCase().includes('cerrad') ? 'cerrado' : 'en_proceso',
        codigoProducto: String(row[colMap['codigo']] || ''),
        descripcion: String(row[colMap['descripcion']] || ''),
        cantidadEstimada: parseNumber(row[colMap['estimada']]),
        cantidadProducida: parseNumber(row[colMap['producida']]),
        diferenciaCantidad: parseNumber(row[colMap['diferencia']]),
        gastosPeriodo: createExpenseBreakdown(row, colMap),
        gastosAcumulados: createExpenseBreakdown(row, colMap),
        costoUnitario: parseNumber(row[colMap['costoUnitario']]),
        costoTotal: parseNumber(row[colMap['totalGasto']]),
        horasManoObra: parseNumber(row[colMap['horas']]),
      };

      orders.push(order);
      processedRows++;
    } catch (rowError) {
      warnings.push({ row: i + 1, message: `Error procesando fila: ${rowError}` });
    }
  }

  return {
    success: orders.length > 0,
    data: orders,
    errors,
    warnings,
    summary: { totalRows, processedRows, skippedRows: totalRows - processedRows },
  };
}

// Parse archivo de Producción (ModelosDeReportesDeProducc.xlsx)
export function parseProduccion(buffer: ArrayBuffer): ParseResult<{
  kpis: Partial<CampaignKPIs>;
  varianzas: { rubro: string; budget: number; actual: number; variance: number }[];
}> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: ParseResult<unknown>['errors'] = [];
  const warnings: ParseResult<unknown>['warnings'] = [];

  try {
    const kpis: Partial<CampaignKPIs> = {};
    const varianzas: { rubro: string; budget: number; actual: number; variance: number }[] = [];

    // Buscar hoja de comparativo por rubro
    const rubroSheet = workbook.Sheets['3ComparaXRubro'] || workbook.Sheets[Object.keys(workbook.Sheets).find(s => s.includes('Compara')) || ''];

    if (rubroSheet) {
      const data = XLSX.utils.sheet_to_json(rubroSheet, { header: 1 }) as unknown[][];

      let totalRows = 0;
      let processedRows = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;

        const rubro = String(row[0] || '').trim();
        if (!rubro || rubro.length < 2) continue;

        totalRows++;

        const budget = parseNumber(row[1]);
        const actual = parseNumber(row[2]);
        const variance = actual - budget;

        if (!isNaN(budget) && !isNaN(actual)) {
          varianzas.push({ rubro, budget, actual, variance });
          processedRows++;
        }
      }

      // Calcular KPIs agregados
      const totalBudget = varianzas.reduce((sum, v) => sum + v.budget, 0);
      const totalActual = varianzas.reduce((sum, v) => sum + v.actual, 0);

      kpis.presupuestoTotal = totalBudget;
      kpis.gastoReal = totalActual;
      kpis.varianzaTotal = totalActual - totalBudget;
      kpis.varianzaPercent = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

      return {
        success: true,
        data: { kpis, varianzas },
        errors,
        warnings,
        summary: { totalRows, processedRows, skippedRows: totalRows - processedRows },
      };
    }

    errors.push({ message: 'No se encontró hoja de comparativo por rubro' });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  } catch (error) {
    errors.push({ message: `Error al procesar archivo: ${error}` });
    return { success: false, errors, warnings, summary: { totalRows: 0, processedRows: 0, skippedRows: 0 } };
  }
}

// Utilidades
function parseExcelDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  return new Date(String(value));
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = parseFloat(String(value).replace(/[,$]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function createExpenseBreakdown(row: unknown[], colMap: Record<string, number>): ExpenseBreakdown {
  return {
    ppInicial: 0,
    materiales: parseNumber(row[colMap['materiales']]),
    manoObra: parseNumber(row[colMap['manoObra']]),
    serviciosTerceros: parseNumber(row[colMap['servicios']]),
    amortizacion: 0,
    otros: 0,
    activacion: 0,
    total: parseNumber(row[colMap['totalGasto']]),
  };
}

// Detectar tipo de archivo automáticamente
export function detectFileType(fileName: string, buffer: ArrayBuffer): 'presupuesto' | 'gastos_op' | 'produccion' | 'ventas' | 'unknown' {
  const nameLower = fileName.toLowerCase();

  // Detectar por nombre de archivo
  if (nameLower.includes('presupuest') || nameLower.includes('tablero') || nameLower.includes('data presupuesto') || nameLower.includes('costo')) {
    return 'presupuesto';
  }
  // Detectar EEFF - Orden Trabajo
  if (nameLower.includes('eeff') || nameLower.includes('orden trabajo') || nameLower.includes('orden de trabajo')) {
    return 'gastos_op';
  }
  if (nameLower.includes('gasto') && nameLower.includes('op')) {
    return 'gastos_op';
  }
  if (nameLower.includes('producc') || nameLower.includes('modelos')) {
    return 'produccion';
  }
  if (nameLower.includes('venta') || nameLower.includes('lote')) {
    return 'ventas';
  }

  // Intentar detectar por contenido de hojas
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames.join(' ').toLowerCase();

    // Detectar formato de presupuesto
    if (sheetNames.includes('presupuesto') || sheetNames.includes('tablero') ||
        sheetNames.includes('costo') || sheetNames.includes('has')) {
      return 'presupuesto';
    }

    // Detectar gastos por OP (incluye ag-grid que es formato matriz)
    if (sheetNames.includes('gasto') || sheetNames.includes('orden') || sheetNames.includes('ag-grid')) {
      return 'gastos_op';
    }

    // Detectar producción/reportes
    if (sheetNames.includes('impacto') || sheetNames.includes('rendimiento') ||
        sheetNames.includes('compara') || sheetNames.includes('resultado')) {
      return 'produccion';
    }

    // Intentar detectar por contenido de la primera hoja
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

    // Buscar patrones en las primeras filas
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      const rowText = row.map(c => String(c || '')).join(' ');

      // Detectar formato matriz de OPs (OA_*, OK_*, OP_*)
      if (/O[AKP]_\d+/.test(rowText)) {
        return 'gastos_op';
      }

      const rowTextLower = rowText.toLowerCase();
      if (rowTextLower.includes('campaña') && (rowTextLower.includes('has') || rowTextLower.includes('tc'))) {
        return 'presupuesto';
      }
      if (rowTextLower.includes('almacigo') || rowTextLower.includes('almácigo') ||
          rowTextLower.includes('packing') || rowTextLower.includes('campo definitivo')) {
        return 'presupuesto';
      }
    }

  } catch {
    // Ignorar errores de parsing
  }

  return 'unknown';
}
