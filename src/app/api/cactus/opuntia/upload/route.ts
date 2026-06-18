import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { getActiveCompanyId } from '@/lib/cactus/companies';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BUCKET = 'site-media';
const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
};

// POST (multipart: file) → sube una imagen del sitio de Opuntia y devuelve su URL pública.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const companyId = await getActiveCompanyId(supabase, user.id);

  let file: File | null = null;
  try { const form = await req.formData(); file = form.get('file') as File | null; } catch { return NextResponse.json({ ok: false, error: 'Archivo inválido.' }, { status: 400 }); }
  if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ ok: false, error: 'Falta el archivo.' }, { status: 400 });
  if (!(file.type || '').startsWith('image/')) return NextResponse.json({ ok: false, error: 'Solo imágenes.' }, { status: 400 });
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'Máximo 6 MB.' }, { status: 400 });
  const ext = EXT[file.type] || 'png';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: 'Storage no configurado en el servidor.' }, { status: 500 });
  const admin = createSb(url, key, { auth: { persistSession: false } });

  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* ya existe */ }

  const path = `${companyId || user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const up = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type || 'image/png', upsert: true });
  if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });

  const pub = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.data.publicUrl });
}
