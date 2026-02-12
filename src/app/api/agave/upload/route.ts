import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexion' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    // Detect file type and parse
    let result: any = {
      tipo: 'desconocido',
      productos: [],
      ventas: [],
      resumen: null,
    };

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      result = await parseExcel(buffer);
    } else if (fileName.endsWith('.csv')) {
      result = await parseCSV(buffer);
    } else if (fileName.endsWith('.pdf')) {
      // For PDFs, we'd need OCR - for now return placeholder
      result = {
        tipo: 'pdf',
        mensaje: 'PDF recibido. Por ahora, te recomiendo copiar los datos a Excel.',
        productos: [],
      };
    } else if (file.type.startsWith('image/')) {
      // For images, we'd need vision API - placeholder for now
      result = {
        tipo: 'imagen',
        mensaje: 'Imagen recibida. Describeme que datos contiene y los proceso.',
        productos: [],
      };
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      ...result,
    });
  } catch (error: any) {
    console.error('AGAVE upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando archivo' },
      { status: 500 }
    );
  }
}

async function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  const result: any = {
    tipo: 'excel',
    hojas: sheetNames,
    productos: [],
    ventas: [],
    columnas: {},
  };

  // Try to auto-detect structure from first sheet
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

  if (data.length === 0) {
    return result;
  }

  // Find header row (first row with multiple non-empty cells)
  let headerRow = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const nonEmpty = (data[i] || []).filter(cell => cell !== null && cell !== undefined && cell !== '').length;
    if (nonEmpty >= 3) {
      headerRow = i;
      break;
    }
  }

  const headers = (data[headerRow] || []).map(h => String(h || '').toLowerCase());
  result.columnas.detectadas = headers.filter(h => h);

  // Try to identify columns
  const columnMap: Record<string, number> = {};

  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes('producto') || h.includes('descripcion') || h.includes('item') || h.includes('articulo')) {
      columnMap.producto = index;
    }
    if (h.includes('costo') && !h.includes('total')) {
      columnMap.costo = index;
    }
    if (h.includes('precio') && !h.includes('total')) {
      columnMap.precio = index;
    }
    if (h.includes('cantidad') || h.includes('qty') || h.includes('volumen')) {
      columnMap.cantidad = index;
    }
    if (h.includes('cliente') || h.includes('customer')) {
      columnMap.cliente = index;
    }
    if (h.includes('margen')) {
      columnMap.margen = index;
    }
    if (h.includes('fecha') || h.includes('date')) {
      columnMap.fecha = index;
    }
  });

  result.columnas.mapeadas = columnMap;

  // Extract products if we found the right columns
  if (columnMap.producto !== undefined) {
    for (let i = headerRow + 1; i < Math.min(data.length, 100); i++) {
      const row = data[i];
      if (!row || !row[columnMap.producto]) continue;

      const producto: any = {
        nombre: String(row[columnMap.producto] || ''),
      };

      if (columnMap.costo !== undefined && row[columnMap.costo]) {
        producto.costo = parseFloat(row[columnMap.costo]) || 0;
      }
      if (columnMap.precio !== undefined && row[columnMap.precio]) {
        producto.precio = parseFloat(row[columnMap.precio]) || 0;
      }
      if (columnMap.cantidad !== undefined && row[columnMap.cantidad]) {
        producto.cantidad = parseFloat(row[columnMap.cantidad]) || 0;
      }
      if (columnMap.cliente !== undefined && row[columnMap.cliente]) {
        producto.cliente = String(row[columnMap.cliente]);
      }

      // Calculate margin if we have price and cost
      if (producto.precio && producto.costo) {
        producto.margen = ((producto.precio - producto.costo) / producto.precio) * 100;
      }

      if (producto.nombre) {
        result.productos.push(producto);
      }
    }
  }

  // Generate summary
  if (result.productos.length > 0) {
    const productosUnicos = Array.from(new Set(result.productos.map((p: any) => p.nombre)));
    const totalVentas = result.productos.reduce((sum: number, p: any) => sum + (p.precio * (p.cantidad || 1) || 0), 0);
    const totalCosto = result.productos.reduce((sum: number, p: any) => sum + (p.costo * (p.cantidad || 1) || 0), 0);

    result.resumen = {
      productosUnicos: productosUnicos.length,
      registros: result.productos.length,
      totalVentas: Math.round(totalVentas * 100) / 100,
      totalCosto: Math.round(totalCosto * 100) / 100,
      margenPromedio: totalVentas > 0 ? Math.round(((totalVentas - totalCosto) / totalVentas) * 10000) / 100 : 0,
    };
  }

  return result;
}

async function parseCSV(buffer: ArrayBuffer) {
  const text = new TextDecoder().decode(buffer);
  const workbook = XLSX.read(text, { type: 'string' });
  return parseExcel(await new Response(text).arrayBuffer());
}
