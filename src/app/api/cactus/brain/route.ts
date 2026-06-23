import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { indexKnowledgeItem } from '@/lib/cactus/rag';
import { safeFetchText } from '@/lib/cactus/safe-url';

export const maxDuration = 60;
export const runtime = 'nodejs'; // safeFetchText usa dns/promises (anti-SSRF)

interface InItem { title?: string; content?: string; kind?: string; sourceUrl?: string }

// Añade contenido al Cerebro (conocimiento/RAG). Acepta varios ítems.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'No configurado' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const items: InItem[] = Array.isArray(body?.items) ? body.items : (body?.title || body?.content ? [body] : []);
  const clean = items
    .map((i) => ({ title: (i.title || '').trim(), content: (i.content || '').trim(), kind: i.kind || (i.sourceUrl ? 'url' : 'doc'), sourceUrl: (i.sourceUrl || '').trim() }))
    .filter((i) => i.title && (i.content || i.sourceUrl));
  if (clean.length === 0) return NextResponse.json({ error: 'Nada que añadir: falta título y contenido.' }, { status: 400 });

  const companyId = await getActiveCompanyId(supabase, user.id);
  let added = 0;
  for (const it of clean) {
    // Si es una URL web sin contenido, intenta leer el texto de la página (RAG).
    let content = it.content;
    if (!content && it.sourceUrl && /^https?:\/\//i.test(it.sourceUrl)) {
      content = await fetchUrlText(it.sourceUrl);
    }
    const { data, error } = await supabase
      .from('cactus_knowledge_items')
      .insert({ user_id: user.id, title: it.title.slice(0, 200), kind: it.kind, content: content || null, source_url: it.sourceUrl || null, ...(companyId ? { company_id: companyId } : {}) })
      .select('id').single();
    if (error || !data) continue;
    added++;
    if (companyId && content) {
      try { await indexKnowledgeItem(supabase, companyId, { id: data.id, title: it.title, content, kind: it.kind }); } catch { /* indexa luego con Reindexar */ }
    }
  }
  return NextResponse.json({ added });
}

// Lee el texto visible de una URL (best-effort, con timeout). Redes con login
// devuelven poco; webs públicas sí dan contenido útil.
async function fetchUrlText(url: string): Promise<string> {
  try {
    // safeFetchText valida que la URL sea pública (anti-SSRF) y sigue redirects
    // revalidando cada salto; si apunta a la red interna lanza y caemos al catch.
    const html = await safeFetchText(url, { timeoutMs: 12000 });
    if (!html) return '';
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 20000);
  } catch {
    return '';
  }
}
