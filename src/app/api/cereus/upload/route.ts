import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
  'image/gif', 'application/pdf',
];
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

const VALID_BUCKETS = [
  'cereus-garment-images',
  'cereus-material-swatches',
];

// POST /api/cereus/upload — Upload image to Supabase Storage
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
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }

    if (!bucket || !VALID_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: `Invalid bucket. Use: ${VALID_BUCKETS.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 15MB.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Allowed: JPEG, PNG, WebP, SVG, GIF, PDF.' }, { status: 400 });
    }

    // Build storage path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = folder
      ? `${folder}/${timestamp}_${safeName}`
      : `${timestamp}_${safeName}`;

    // Upload via service client (bypasses RLS on storage)
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket,
      path: storagePath,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
