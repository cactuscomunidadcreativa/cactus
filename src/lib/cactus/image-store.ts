// ═══════════════════════════════════════════════════════════════════════════
// Persistencia de imágenes generadas. generateImage / Flux Kontext devuelven una
// URL TEMPORAL (válida ~1h) o un data:base64. Si guardamos eso tal cual en un
// entregable, la imagen DESAPARECE al rato (se rompe el <img>). Aquí la
// descargamos/decodificamos y la re-subimos a un bucket público de Supabase
// Storage → URL permanente. RESILIENTE: si algo falla (sin storage, fetch caído),
// devuelve la URL original — mejor una imagen temporal que romper el flujo.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient as createSb } from '@supabase/supabase-js';

const BUCKET = 'deliverables';

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/webp': 'webp', 'image/gif': 'gif',
};

/** Descarga/decodifica una imagen (URL temporal http(s) o data:base64) y la
 *  re-sube a Storage. Devuelve la URL pública permanente, o la original si no
 *  se pudo persistir. `scope` organiza las rutas (p. ej. company_id); `slug`
 *  identifica al agente/modo. */
export async function persistImage(
  src: string,
  opts: { scope?: string | null; slug?: string } = {},
): Promise<string> {
  try {
    if (!src) return src;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return src; // sin storage en el servidor → deja la original

    let buffer: Buffer;
    let contentType = 'image/png';

    if (src.startsWith('data:')) {
      const m = src.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return src;
      contentType = m[1] || 'image/png';
      buffer = Buffer.from(m[2], 'base64');
    } else if (/^https?:\/\//.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return src;
      contentType = res.headers.get('content-type') || 'image/png';
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      return src;
    }

    const admin = createSb(url, key, { auth: { persistSession: false } });
    try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* ya existe */ }

    const ext = EXT_BY_MIME[contentType.split(';')[0].trim()] || 'png';
    const scope = (opts.scope || 'nocompany').replace(/[^a-zA-Z0-9_-]/g, '');
    const slug = (opts.slug || 'img').replace(/[^a-zA-Z0-9_-]/g, '');
    const path = `${scope}/${slug}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const up = await admin.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
    if (up.error) return src;
    const pub = admin.storage.from(BUCKET).getPublicUrl(path);
    return pub.data.publicUrl || src;
  } catch {
    return src;
  }
}
