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

/** ¿La sentencia es solo comentarios/espacios? (no se envía a Postgres). */
function isOnlyComments(s: string): boolean {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim().length === 0;
}

/**
 * Divide el SQL en sentencias respetando bloques con comillas de dólar
 * ($$…$$, $f$…$f$), strings 'simples' y comentarios (-- y bloque). Necesario:
 * el esquema multiempresa usa funciones plpgsql y bloques DO con ';' internos,
 * así que NO se puede partir ingenuamente por ';'.
 */
function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let dollar: string | null = null; // tag de dólar abierto, p.ej. "$$" o "$f$"
  let inLine = false;               // comentario --
  let inBlock = false;              // comentario /* */
  let inStr = false;                // string '...'
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    const two = sql.slice(i, i + 2);

    if (inLine) { buf += c; if (c === '\n') inLine = false; i++; continue; }
    if (inBlock) { if (two === '*/') { buf += '*/'; i += 2; inBlock = false; continue; } buf += c; i++; continue; }
    if (dollar) {
      if (sql.startsWith(dollar, i)) { buf += dollar; i += dollar.length; dollar = null; continue; }
      buf += c; i++; continue;
    }
    if (inStr) {
      if (c === "'") {
        if (sql[i + 1] === "'") { buf += "''"; i += 2; continue; } // escape ''
        inStr = false; buf += c; i++; continue;
      }
      buf += c; i++; continue;
    }
    // estado normal
    if (two === '--') { inLine = true; buf += two; i += 2; continue; }
    if (two === '/*') { inBlock = true; buf += two; i += 2; continue; }
    if (c === "'") { inStr = true; buf += c; i++; continue; }
    if (c === '$') {
      const m = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (m) { dollar = m[0]; buf += m[0]; i += m[0].length; continue; }
      buf += c; i++; continue;
    }
    if (c === ';') {
      const stmt = buf.trim();
      if (stmt && !isOnlyComments(stmt)) out.push(stmt);
      buf = '';
      i++;
      continue;
    }
    buf += c; i++;
  }
  const tail = buf.trim();
  if (tail && !isOnlyComments(tail)) out.push(tail);
  return out;
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
