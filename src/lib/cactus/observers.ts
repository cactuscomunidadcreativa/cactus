// ═══════════════════════════════════════════════════════════════════════════
// Observadores v1 (Fase A · Acción 6): Radar / Vigía / Scout
// Buscan en web (si hay key) y levantan alertas → Ramona (bus de alerts).
// HONESTO: sin proveedor de búsqueda (TAVILY_API_KEY o SERPER_API_KEY) NO inventan
// nada; quedan "en espera". Apenas se configure una key, empiezan a producir alertas.
// ═══════════════════════════════════════════════════════════════════════════
import { raiseAlert } from './alerts';
import { generateContent } from '@/lib/ai';

type DB = any;

const OBSERVERS = [
  { slug: 'radar', type: 'news', focus: 'noticias, regulaciones y cambios de industria' },
  { slug: 'vigia', type: 'reputation', focus: 'redes sociales, reputación y menciones de marca' },
  { slug: 'scout', type: 'opportunity', focus: 'licitaciones, RFPs, convocatorias y leads' },
] as const;

export interface SearchResult { title: string; url: string; snippet: string }

/** Búsqueda web v1 (Tavily o Serper). Devuelve null si no hay proveedor configurado. */
export async function webSearch(query: string): Promise<SearchResult[] | null> {
  const tavily = process.env.TAVILY_API_KEY;
  const serper = process.env.SERPER_API_KEY;
  try {
    if (tavily) {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavily, query, max_results: 5, search_depth: 'basic' }),
      });
      const d = await r.json();
      return (d.results || []).map((x: any) => ({ title: x.title, url: x.url, snippet: x.content || '' }));
    }
    if (serper) {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST', headers: { 'X-API-KEY': serper, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query }),
      });
      const d = await r.json();
      return (d.organic || []).slice(0, 5).map((x: any) => ({ title: x.title, url: x.link, snippet: x.snippet || '' }));
    }
    return null;
  } catch {
    return null;
  }
}

/** Corre los 3 observadores para una empresa; resume y levanta alertas deduplicadas por día. */
export async function runObserversForCompany(
  db: DB,
  companyId: string,
  ctx: { name?: string | null; industry?: string | null; audience?: string | null },
  today: string,
): Promise<{ ran: boolean; alerts: number; skipped?: string }> {
  const topic = [ctx.name, ctx.industry, ctx.audience].filter(Boolean).join(' · ');
  if (!topic) return { ran: false, alerts: 0, skipped: 'empresa sin contexto' };

  let created = 0;
  let anySearch = false;
  for (const o of OBSERVERS) {
    const results = await webSearch(`${o.focus} ${topic}`);
    if (results === null) continue;     // sin proveedor de búsqueda → en espera
    anySearch = true;
    if (!results.length) continue;
    try {
      const sources = results.slice(0, 5).map((r) => `- ${r.title}: ${r.snippet} (${r.url})`).join('\n');
      const res = await generateContent({
        prompt: `Eres ${o.slug}, observador de Cactus. Resume en 1-2 frases el hallazgo más relevante para "${topic}" sobre ${o.focus}, y por qué le importa al negocio. Fuentes:\n${sources}`,
        systemPrompt: 'Responde conciso y accionable, en español. Si no hay nada relevante, responde exactamente "SIN_NOVEDAD".',
        maxTokens: 220, temperature: 0.5,
      });
      if (res.content.trim().toUpperCase().startsWith('SIN_NOVEDAD')) continue;
      const name = o.slug[0].toUpperCase() + o.slug.slice(1);
      const ok = await raiseAlert(db, {
        companyId, origin: o.slug, type: o.type, severity: 'info',
        title: `${name}: ${o.focus.split(',')[0]}`,
        body: res.content,
        dedupKey: `${o.slug}-${today}`,
        payload: { sources: results.slice(0, 5) },
      });
      if (ok) created++;
    } catch { /* noop */ }
  }
  return { ran: anySearch, alerts: created, skipped: anySearch ? undefined : 'sin proveedor de búsqueda (define TAVILY_API_KEY o SERPER_API_KEY)' };
}
