// ═══════════════════════════════════════════════════════════════════════════
// Embeddings (Fase B · Cerebro RAG) — OpenAI text-embedding-3-small (1536 dims).
// Resiliente: si no hay key de OpenAI, devuelve null y el RAG cae a búsqueda por texto.
// ═══════════════════════════════════════════════════════════════════════════
import { getAPIKey } from './config';

export const EMBED_MODEL = 'text-embedding-3-small';
export const EMBED_DIM = 1536;

/** Embedding de un texto (null si no hay proveedor o falla). */
export async function embed(text: string): Promise<number[] | null> {
  const clean = (text || '').trim();
  if (!clean) return null;
  const key = await getAPIKey('openai');
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: clean.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.data?.[0]?.embedding;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** Embeddings en lote (orden preservado; null por item que falle). */
export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const clean = texts.map((t) => (t || '').trim());
  const key = await getAPIKey('openai');
  if (!key || !clean.some(Boolean)) return texts.map(() => null);
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: clean.map((t) => t.slice(0, 8000) || ' ') }),
    });
    if (!res.ok) return texts.map(() => null);
    const data = await res.json();
    const out: (number[] | null)[] = texts.map(() => null);
    for (const row of (data?.data || [])) {
      if (typeof row.index === 'number' && Array.isArray(row.embedding)) out[row.index] = row.embedding;
    }
    return out;
  } catch {
    return texts.map(() => null);
  }
}

/** Literal de pgvector a partir de un arreglo de floats: '[0.1,0.2,...]'. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`;
}
