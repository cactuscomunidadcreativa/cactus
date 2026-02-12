/**
 * AGAVE Excel Parser
 * Procesa archivos de ventas, precios y costos para el motor de pricing
 */

import * as XLSX from 'xlsx';

// Tipos para los datos de AGAVE
export interface ProductPricing {
  codigo: string;
  nombre: string;
  proveedor?: string;
  concentracion?: number;
  clasificacion?: string;

  // Costos
  costoCIF: number;
  porcentajeInternado: number;
  costoInternado: number;
  porcentajeFlete: number;
  costoPuestoCliente: number;

  // Márgenes objetivo
  margenObjetivo: number;

  // Rangos de precio
  precios: {
    critico: number;
    muyBajo: number;
    bajo: number;
    aceptable: number;
    bueno: number;
    muyBueno: number;
    sobresaliente: number;
    excelente: number;
  };

  // Comisiones por rango
  comisiones: {
    bajo: number;
    aceptable: number;
    bueno: number;
    muyBueno: number;
    sobresaliente: number;
    excelente: number;
  };
}

export interface SalesRecord {
  fecha: Date;
  producto: string;
  cliente: string;
  clienteNombre: string;
  cantidad: number;
  precioUnitario: number;
  valorVenta: number;
  costoUnitario: number;
  costoTotal: number;
  margenUnitario: number;
  margenPorcentaje: number;
  categoriaPrecio: string;
  vendedor: string;
  condicionPago: string;
}

export interface ProductSummary {
  producto: string;
  categoriaPrecio: string;
  cantidadTotal: number;
  ventaTotal: number;
  precioPromedio: number;
  costoTotal: number;
  costoPromedio: number;
  margenPromedio: number;
  margenPorcentaje: number;
}

export interface AgaveData {
  productos: ProductPricing[];
  ventas: SalesRecord[];
  resumen: ProductSummary[];
  periodo: {
    desde: Date;
    hasta: Date;
  };
}

/**
 * Parsea la hoja de Precios (matriz de pricing)
 */
export function parsePreciosSheet(workbook: XLSX.WorkBook): ProductPricing[] {
  const sheet = workbook.Sheets['Precios'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const productos: ProductPricing[] = [];

  // Los datos empiezan en la fila 5 (índice 4)
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue; // Skip empty rows

    const producto: ProductPricing = {
      codigo: String(row[1] || ''),
      nombre: String(row[1] || ''),
      proveedor: String(row[0] || ''),
      concentracion: parseFloat(row[2]) || 0,
      clasificacion: String(row[3] || ''),

      costoCIF: parseFloat(row[4]) || 0,
      porcentajeInternado: parseFloat(row[5]) || 0,
      costoInternado: parseFloat(row[6]) || 0,
      porcentajeFlete: parseFloat(row[7]) || 0,
      costoPuestoCliente: parseFloat(row[8]) || 0,
      margenObjetivo: parseFloat(row[9]) || 0.27, // Default 27%

      precios: {
        critico: parseFloat(row[16]) || 0,
        muyBajo: parseFloat(row[17]) || 0,
        bajo: parseFloat(row[18]) || 0,
        aceptable: parseFloat(row[19]) || 0,
        bueno: parseFloat(row[20]) || 0,
        muyBueno: parseFloat(row[21]) || 0,
        sobresaliente: parseFloat(row[22]) || 0,
        excelente: parseFloat(row[23]) || 0,
      },

      comisiones: {
        bajo: parseFloat(row[25]) || 0.01,
        aceptable: parseFloat(row[26]) || 0.015,
        bueno: parseFloat(row[27]) || 0.02,
        muyBueno: parseFloat(row[28]) || 0.028,
        sobresaliente: parseFloat(row[29]) || 0.035,
        excelente: parseFloat(row[30]) || 0.043,
      },
    };

    if (producto.nombre && producto.costoCIF > 0) {
      productos.push(producto);
    }
  }

  return productos;
}

/**
 * Parsea la hoja de DataVetas2025 (ventas detalladas)
 */
export function parseVentasSheet(workbook: XLSX.WorkBook): SalesRecord[] {
  const sheet = workbook.Sheets['DataVetas2025'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const ventas: SalesRecord[] = [];

  // Headers en fila 1, datos desde fila 2
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[20]) continue; // Skip if no product name

    const venta: SalesRecord = {
      fecha: row[9] ? new Date(row[9]) : new Date(),
      producto: String(row[20] || ''),
      cliente: String(row[58] || ''),
      clienteNombre: String(row[59] || ''),
      cantidad: parseFloat(row[31]) || 0,
      precioUnitario: parseFloat(row[47]) || 0, // V.Unit dol
      valorVenta: parseFloat(row[48]) || 0, // V.Venta dol
      costoUnitario: parseFloat(row[52]) || 0, // Costo Unit.
      costoTotal: parseFloat(row[53]) || 0, // Total costo dol
      margenUnitario: 0,
      margenPorcentaje: 0,
      categoriaPrecio: String(row[93] || 'Sin categoría'),
      vendedor: String(row[81] || ''),
      condicionPago: String(row[83] || ''),
    };

    // Calcular margen
    if (venta.precioUnitario > 0 && venta.costoUnitario > 0) {
      venta.margenUnitario = venta.precioUnitario - venta.costoUnitario;
      venta.margenPorcentaje = (venta.margenUnitario / venta.precioUnitario) * 100;
    }

    if (venta.producto && venta.cantidad > 0) {
      ventas.push(venta);
    }
  }

  return ventas;
}

/**
 * Parsea la hoja TD Ventas (resumen por producto)
 */
export function parseResumenSheet(workbook: XLSX.WorkBook): ProductSummary[] {
  const sheet = workbook.Sheets['TD Ventas'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const resumen: ProductSummary[] = [];

  let currentProduct = '';

  // Datos desde fila 2
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Si hay nombre de producto, actualizar el producto actual
    if (row[0]) {
      currentProduct = String(row[0]);
    }

    if (!currentProduct || !row[1]) continue;

    const item: ProductSummary = {
      producto: currentProduct,
      categoriaPrecio: String(row[1] || ''),
      cantidadTotal: parseFloat(row[2]) || 0,
      ventaTotal: parseFloat(row[3]) || 0,
      precioPromedio: parseFloat(row[4]) || 0,
      costoTotal: parseFloat(row[5]) || 0,
      costoPromedio: parseFloat(row[6]) || 0,
      margenPromedio: parseFloat(row[7]) || 0,
      margenPorcentaje: (parseFloat(row[8]) || 0) * 100,
    };

    if (item.cantidadTotal > 0) {
      resumen.push(item);
    }
  }

  return resumen;
}

/**
 * Parser principal - procesa el archivo completo
 */
export async function parseAgaveExcel(buffer: ArrayBuffer): Promise<AgaveData> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const productos = parsePreciosSheet(workbook);
  const ventas = parseVentasSheet(workbook);
  const resumen = parseResumenSheet(workbook);

  // Calcular periodo de los datos
  const fechas = ventas.map(v => v.fecha).filter(f => f instanceof Date && !isNaN(f.getTime()));
  const periodo = {
    desde: fechas.length > 0 ? new Date(Math.min(...fechas.map(f => f.getTime()))) : new Date(),
    hasta: fechas.length > 0 ? new Date(Math.max(...fechas.map(f => f.getTime()))) : new Date(),
  };

  return {
    productos,
    ventas,
    resumen,
    periodo,
  };
}

/**
 * Calcula el precio recomendado para un producto
 */
export function calcularPrecioRecomendado(
  costoUnitario: number,
  margenObjetivo: number = 0.27,
  producto?: ProductPricing
): {
  minimo: number;
  recomendado: number;
  optimo: number;
  premium: number;
  categoria: string;
} {
  // Si no hay producto con rangos, calcular basado en margen
  if (!producto) {
    const recomendado = costoUnitario / (1 - margenObjetivo);
    return {
      minimo: costoUnitario / (1 - 0.15), // 15% margen mínimo
      recomendado,
      optimo: costoUnitario / (1 - 0.31), // 31% margen bueno
      premium: costoUnitario / (1 - 0.37), // 37% margen muy bueno
      categoria: 'Aceptable',
    };
  }

  // Usar rangos del producto
  return {
    minimo: producto.precios.muyBajo || costoUnitario * 1.15,
    recomendado: producto.precios.aceptable || costoUnitario * 1.27,
    optimo: producto.precios.bueno || costoUnitario * 1.31,
    premium: producto.precios.muyBueno || costoUnitario * 1.37,
    categoria: 'Aceptable',
  };
}

/**
 * Clasifica un precio en una categoría
 */
export function clasificarPrecio(
  precio: number,
  producto: ProductPricing
): string {
  if (precio >= producto.precios.excelente) return 'Excelente';
  if (precio >= producto.precios.sobresaliente) return 'Sobresaliente';
  if (precio >= producto.precios.muyBueno) return 'Muy Bueno';
  if (precio >= producto.precios.bueno) return 'Bueno';
  if (precio >= producto.precios.aceptable) return 'Aceptable';
  if (precio >= producto.precios.bajo) return 'Bajo';
  if (precio >= producto.precios.muyBajo) return 'Muy Bajo';
  return 'Crítico';
}

/**
 * Obtiene estadísticas históricas de un producto
 */
export function getProductStats(
  producto: string,
  ventas: SalesRecord[]
): {
  cantidadTotal: number;
  ventaTotal: number;
  precioPromedio: number;
  costoPromedio: number;
  margenPromedio: number;
  clientesUnicos: number;
  ventasPorCategoria: Record<string, number>;
} {
  const ventasProducto = ventas.filter(v =>
    v.producto.toLowerCase().includes(producto.toLowerCase())
  );

  if (ventasProducto.length === 0) {
    return {
      cantidadTotal: 0,
      ventaTotal: 0,
      precioPromedio: 0,
      costoPromedio: 0,
      margenPromedio: 0,
      clientesUnicos: 0,
      ventasPorCategoria: {},
    };
  }

  const cantidadTotal = ventasProducto.reduce((sum, v) => sum + v.cantidad, 0);
  const ventaTotal = ventasProducto.reduce((sum, v) => sum + v.valorVenta, 0);
  const costoTotal = ventasProducto.reduce((sum, v) => sum + v.costoTotal, 0);

  const clientesUnicos = new Set(ventasProducto.map(v => v.cliente)).size;

  const ventasPorCategoria: Record<string, number> = {};
  ventasProducto.forEach(v => {
    ventasPorCategoria[v.categoriaPrecio] = (ventasPorCategoria[v.categoriaPrecio] || 0) + v.cantidad;
  });

  return {
    cantidadTotal,
    ventaTotal,
    precioPromedio: cantidadTotal > 0 ? ventaTotal / cantidadTotal : 0,
    costoPromedio: cantidadTotal > 0 ? costoTotal / cantidadTotal : 0,
    margenPromedio: ventaTotal > 0 ? ((ventaTotal - costoTotal) / ventaTotal) * 100 : 0,
    clientesUnicos,
    ventasPorCategoria,
  };
}
