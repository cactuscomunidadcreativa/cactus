import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { canManageCompany } from '@/lib/cactus/rbac';
import { isSuperAdmin } from '@/lib/admin/auth';
import { saveAgentConfig } from '@/lib/cactus/agent-access';
import { getAgent } from '@/lib/cactus/agents-catalog';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BUCKET = 'agent-images';
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

// POST (multipart: file) ?scope=company|global → sube la foto y la guarda en agent_configs.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) return NextResponse.json({ ok: false, error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const scope = new URL(req.url).searchParams.get('scope') === 'global' ? 'global' : 'company';
  const companyId = await getActiveCompanyId(supabase, user.id);

  if (scope === 'global') {
    if (!isSuperAdmin(user.email)) return NextResponse.json({ ok: false, error: 'Solo Cactus (super-admin) edita el nivel global.' }, { status: 403 });
  } else {
    if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
    if (!(await canManageCompany(supabase, user, companyId))) return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede editar agentes.' }, { status: 403 });
  }

  let file: File | null = null;
  try { const form = await req.formData(); file = form.get('file') as File | null; } catch { return NextResponse.json({ ok: false, error: 'Archivo inválido.' }, { status: 400 }); }
  if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ ok: false, error: 'Falta el archivo.' }, { status: 400 });
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'Máximo 6 MB.' }, { status: 400 });
  const ext = EXT[file.type] || 'png';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: 'Storage no configurado en el servidor.' }, { status: 500 });
  const admin = createSb(url, key, { auth: { persistSession: false } });

  // Asegura el bucket público (idempotente)
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* ya existe */ }

  const path = `${scope === 'global' ? 'global' : companyId}/${params.slug}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const up = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type || 'image/png', upsert: true });
  if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });

  const pub = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.data.publicUrl;

  // Guarda la URL en el nivel correcto (RLS del usuario aplica)
  const saved = await saveAgentConfig(supabase, scope === 'global' ? null : companyId, params.slug, { image_url: publicUrl });
  if (!saved) return NextResponse.json({ ok: false, error: 'La foto se subió pero no se pudo guardar en el agente (¿permisos?).', url: publicUrl }, { status: 500 });

  return NextResponse.json({ ok: true, url: publicUrl });
}
