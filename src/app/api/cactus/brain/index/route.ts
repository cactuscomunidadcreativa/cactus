import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { reindexCompany } from '@/lib/cactus/rag';

export const maxDuration = 60;

// GET → conteo de chunks del Cerebro de la empresa activa.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ chunks: 0, embedded: 0 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ chunks: 0, embedded: 0, companyId: null });
  try {
    const { count } = await supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
    const { count: embedded } = await supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true }).eq('company_id', companyId).not('embedding', 'is', null);
    return NextResponse.json({ chunks: count || 0, embedded: embedded || 0 });
  } catch {
    return NextResponse.json({ chunks: 0, embedded: 0 });
  }
}

// POST → reindexa el Cerebro (brand kits + knowledge items) de la empresa activa.
export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  const result = await reindexCompany(supabase, companyId);
  return NextResponse.json(result);
}
