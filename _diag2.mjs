import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = {};
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g,'').trim();
}
// Usa la ANON key (como el navegador) para probar si el RPC está EXPUESTO por PostgREST
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false} });
const { data, error } = await sb.rpc('cactus_ensure_default_company', { p_user: null });
if (error) console.log('RPC error:', error.code, '-', error.message);
else console.log('RPC OK (expuesto). Devolvió:', JSON.stringify(data));
