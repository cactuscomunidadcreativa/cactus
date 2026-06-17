import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { requireAdmin } from '@/lib/admin/auth';
import { createClient as createSb } from '@supabase/supabase-js';
import { SCHEMA_SQL } from '@/lib/cactus/schema-sql';

export const runtime = 'nodejs';
export const maxDuration = 60;

const POOLER = {
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.ardmymiikpaxhwalgjks',
  database: 'postgres',
};

async function getConnConfig(): Promise<any | null> {
  if (process.env.SUPABASE_DB_URL) {
    return { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let dbUrl = '', dbPw = '';
  if (url && key) {
    const sb = createSb(url, key, { auth: { persistSession: false } });
    const { data } = await sb.from('platform_config').select('key,value').in('key', ['supabase_db_url', 'supabase_db_password']);
    for (const r of (data || [])) {
      if (r.key === 'supabase_db_url') dbUrl = (r.value || '').trim();
      if (r.key === 'supabase_db_password') dbPw = (r.value || '').trim();
    }
  }
  if (dbUrl) return { connectionString: dbUrl, ssl: { rejectUnauthorized: false } };
  if (dbPw) return { ...POOLER, password: dbPw, ssl: { rejectUnauthorized: false } };
  return null;
}

/** Divide el SQL en sentencias (sin bloques $$ en este schema) y limpia comentarios. */
function splitSql(sql: string): string[] {
  return sql.split(';')
    .map((s) => s.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim())
    .filter((s) => s.length > 0);
}

export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const conn = await getConnConfig();
  if (!conn) {
    return NextResponse.json({ ok: false, error: 'Falta la contraseña de la base. Ponla en Configuración → Base de datos.' }, { status: 400 });
  }

  const client = new Client(conn);
  const statements = splitSql(SCHEMA_SQL);
  let okCount = 0;
  const failed: { i: number; head: string; error: string }[] = [];

  try {
    await client.connect();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'No se pudo conectar a la base: ' + (e?.message || e) }, { status: 500 });
  }

  for (let i = 0; i < statements.length; i++) {
    try {
      await client.query(statements[i]);
      okCount++;
    } catch (e: any) {
      failed.push({ i, head: statements[i].slice(0, 70), error: e?.message || 'error' });
    }
  }
  await client.end().catch(() => {});

  return NextResponse.json({ ok: failed.length === 0, total: statements.length, okCount, failed: failed.slice(0, 12) });
}
