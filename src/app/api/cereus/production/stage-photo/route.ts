import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/cereus/production/stage-photo
// Upload a progress photo for a production stage
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('orderId') as string | null;
    const stage = formData.get('stage') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (!orderId || !stage) {
      return NextResponse.json({ error: 'orderId and stage required' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande. Maximo 10MB.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo no soportado. Usa JPEG, PNG o WebP.' }, { status: 400 });
    }

    // Get the order to find maison_id
    const { data: order } = await db
      .from('cereus_orders')
      .select('maison_id')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build storage path: production/{orderId}/{stage}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `production/${orderId}/${stage}/${timestamp}_${safeName}`;

    // Upload to Supabase storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await db.storage
      .from('cereus-garment-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from('cereus-garment-images')
      .getPublicUrl(storagePath);

    const photoUrl = urlData.publicUrl;

    // Create production log entry
    const { data: log, error: logError } = await db
      .from('cereus_production_logs')
      .insert({
        maison_id: order.maison_id,
        order_id: orderId,
        stage,
        log_type: 'photo',
        title: `Foto de avance: ${stage}`,
        content: notes || null,
        photos: [photoUrl],
        created_by: user.id,
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json({
      url: photoUrl,
      logId: log.id,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
