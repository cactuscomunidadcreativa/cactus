import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

// GET - List products for a client
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user has access to this client
    if (clientId) {
      const { data: access } = await supabase
        .from('agave_client_users')
        .select('id')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('activo', true)
        .single();

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!access && !profile?.is_super_admin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build query
    let query = supabase
      .from('agave_products')
      .select('*', { count: 'exact' })
      .eq('activo', true);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
    }

    query = query
      .order('nombre', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('AGAVE products GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching products' },
      { status: 500 }
    );
  }
}

// POST - Create product(s) or import from Excel (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const clientId = formData.get('clientId') as string;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!clientId) {
        return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        return NextResponse.json({ error: 'File has no data' }, { status: 400 });
      }

      // Find header row
      let headerRow = 0;
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const nonEmpty = (data[i] || []).filter(cell => cell != null && cell !== '').length;
        if (nonEmpty >= 2) {
          headerRow = i;
          break;
        }
      }

      const headers = (data[headerRow] || []).map(h => String(h || '').toLowerCase().trim());

      // Map columns
      const columnMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        const h = header.toLowerCase();
        if (h.includes('codigo') || h.includes('code') || h.includes('sku')) {
          columnMap.codigo = index;
        }
        if (h.includes('producto') || h.includes('nombre') || h.includes('descripcion') || h.includes('item')) {
          columnMap.nombre = index;
        }
        if (h.includes('proveedor') || h.includes('supplier')) {
          columnMap.proveedor = index;
        }
        if (h.includes('fob') || (h.includes('costo') && h.includes('fob'))) {
          columnMap.costo_fob = index;
        }
        if (h.includes('cif') || (h.includes('costo') && h.includes('cif'))) {
          columnMap.costo_cif = index;
        }
        if (h.includes('internado') || h.includes('nacionalizado')) {
          columnMap.costo_internado = index;
        }
        if (h.includes('puesto') && h.includes('cliente')) {
          columnMap.costo_puesto_cliente = index;
        }
        // Generic cost column
        if (!columnMap.costo_cif && (h === 'costo' || h === 'cost' || h === 'costo unitario')) {
          columnMap.costo_cif = index;
        }
      });

      if (columnMap.nombre === undefined) {
        return NextResponse.json({
          error: 'Could not find product name column',
          detectedColumns: headers.filter(h => h),
        }, { status: 400 });
      }

      // Parse products
      const products: any[] = [];
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[columnMap.nombre]) continue;

        const product: any = {
          client_id: clientId,
          nombre: String(row[columnMap.nombre] || '').trim(),
        };

        if (columnMap.codigo !== undefined && row[columnMap.codigo]) {
          product.codigo = String(row[columnMap.codigo]).trim();
        }
        if (columnMap.proveedor !== undefined && row[columnMap.proveedor]) {
          product.proveedor = String(row[columnMap.proveedor]).trim();
        }
        if (columnMap.costo_fob !== undefined && row[columnMap.costo_fob]) {
          product.costo_fob = parseFloat(row[columnMap.costo_fob]) || null;
        }
        if (columnMap.costo_cif !== undefined && row[columnMap.costo_cif]) {
          product.costo_cif = parseFloat(row[columnMap.costo_cif]) || null;
        }
        if (columnMap.costo_internado !== undefined && row[columnMap.costo_internado]) {
          product.costo_internado = parseFloat(row[columnMap.costo_internado]) || null;
        }
        if (columnMap.costo_puesto_cliente !== undefined && row[columnMap.costo_puesto_cliente]) {
          product.costo_puesto_cliente = parseFloat(row[columnMap.costo_puesto_cliente]) || null;
        }

        if (product.nombre) {
          products.push(product);
        }
      }

      if (products.length === 0) {
        return NextResponse.json({ error: 'No valid products found in file' }, { status: 400 });
      }

      // Insert products
      const { data: inserted, error: insertError } = await supabase
        .from('agave_products')
        .insert(products)
        .select();

      if (insertError) throw insertError;

      return NextResponse.json({
        success: true,
        imported: inserted?.length || 0,
        products: inserted,
      });
    }

    // Handle JSON body (single or batch insert)
    const body = await request.json();
    const { clientId, products: productsToCreate, product } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Single product
    if (product) {
      const { data: created, error } = await supabase
        .from('agave_products')
        .insert({ ...product, client_id: clientId })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ product: created, success: true });
    }

    // Multiple products
    if (productsToCreate && productsToCreate.length > 0) {
      const productsWithClient = productsToCreate.map((p: any) => ({
        ...p,
        client_id: clientId,
      }));

      const { data: created, error } = await supabase
        .from('agave_products')
        .insert(productsWithClient)
        .select();

      if (error) throw error;
      return NextResponse.json({ products: created, success: true });
    }

    return NextResponse.json({ error: 'No product data provided' }, { status: 400 });
  } catch (error: any) {
    console.error('AGAVE products POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating products' },
      { status: 500 }
    );
  }
}

// PUT - Update a product (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('agave_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product, success: true });
  } catch (error: any) {
    console.error('AGAVE products PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating product' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate a product (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Soft delete
    const { error } = await supabase
      .from('agave_products')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('AGAVE products DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Error deleting product' },
      { status: 500 }
    );
  }
}
