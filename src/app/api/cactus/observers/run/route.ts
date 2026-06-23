import { NextResponse } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { runObserversForCompany } from '@/lib/cactus/observers';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Disparado por Vercel Cron (ver vercel.json). Vercel agrega
// "Authorization: Bearer <CRON_SECRET>" automáticamente si CRON_SECRET está set.
export async function GET(req: Request) {
  // Fail-closed: si NO hay CRON_SECRET configurado o el header no coincide → 401.
  // (Antes, sin CRON_SECRET el guard se saltaba y la ruta quedaba abierta.)
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: 'Supabase no configurado' }, { status: 500 });

  const sb = createSb(url, key, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);

  let companies: any[] = [];
  try {
    const { data, error } = await sb.from('companies').select('id, name, industry').limit(25);
    if (error) return NextResponse.json({ ok: false, error: 'multiempresa no desplegada aún' });
    companies = data || [];
  } catch {
    return NextResponse.json({ ok: false, error: 'sin tabla companies' });
  }

  let totalAlerts = 0;
  const results: any[] = [];
  for (const c of companies) {
    const r = await runObserversForCompany(sb, c.id, { name: c.name, industry: c.industry }, today);
    totalAlerts += r.alerts;
    results.push({ company: c.id, ...r });
  }
  return NextResponse.json({ ok: true, companies: companies.length, totalAlerts, results });
}
