import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { recordFeedback, learnFromFeedback } from '@/lib/cactus/preferences';

// POST { deliverableId?, agentSlug?, rating, comment? } → guarda feedback y aprende.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const deliverableId = (body?.deliverableId || '').toString() || null;
  let agentSlug = (body?.agentSlug || '').toString() || null;
  const rating = Number(body?.rating || 0);
  const comment = (body?.comment || '').toString().trim() || null;
  if (!deliverableId && !comment && !rating) return NextResponse.json({ ok: false, error: 'Nada que registrar.' }, { status: 400 });

  const companyId = await getActiveCompanyId(supabase, user.id);

  // Si no vino agentSlug pero sí el entregable, resuélvelo
  if (!agentSlug && deliverableId) {
    try {
      const { data: d } = await supabase.from('cactus_deliverables').select('agent_slug').eq('id', deliverableId).maybeSingle();
      agentSlug = d?.agent_slug || null;
    } catch { /* noop */ }
  }

  await recordFeedback(supabase, { companyId, userId: user.id, deliverableId, agentSlug, rating, comment });
  if (comment) await learnFromFeedback(supabase, { companyId, agentSlug, comment, rating });
  return NextResponse.json({ ok: true });
}
