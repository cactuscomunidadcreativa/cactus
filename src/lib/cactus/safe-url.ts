// ═══════════════════════════════════════════════════════════════════════════
// Guard anti-SSRF para URLs que da el usuario (Cerebro/RAG, brand-scraper…).
// El server hace fetch a esas URLs y devuelve el cuerpo; sin validar, un usuario
// podía apuntar a la red interna (169.254.169.254 metadata, localhost, rangos
// privados) y robar credenciales/secretos. Aquí: exigimos http/https, prohibimos
// credenciales embebidas, resolvemos el hostname por DNS y RECHAZAMOS si alguna
// IP cae en rango privado/loopback/link-local/única-local. safeFetchText sigue
// los redirects revalidando CADA salto (un 302 a 127.0.0.1 también se bloquea).
// Solo Node runtime (usa dns/promises). Resiliente: lanza Error('URL no permitida').
// ═══════════════════════════════════════════════════════════════════════════
import dns from 'dns/promises';

export const runtime = 'nodejs';

// Hostnames que nunca permitimos (además del filtro por IP).
const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback']);

/** ¿Es una IPv4 en rango privado/loopback/link-local? */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // raro = bloquea
  const [a, b] = parts;
  if (a === 10) return true;                       // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;          // 192.168.0.0/16
  if (a === 127) return true;                       // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true;          // 169.254.0.0/16 (link-local + 169.254.169.254 metadata)
  if (a === 0) return true;                         // 0.0.0.0/8 (this-network)
  return false;
}

/** ¿Es una IPv6 en rango loopback/link-local/única-local? */
function isPrivateIPv6(ip: string): boolean {
  let v = ip.toLowerCase();
  // Quita zona (fe80::1%eth0) y corchetes por si vinieran.
  v = v.replace(/^\[|\]$/g, '').split('%')[0];
  if (v === '::1' || v === '::') return true;                  // loopback / no especificada
  if (v.startsWith('fe80') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')) return true; // fe80::/10 (link-local)
  if (/^f[cd]/.test(v)) return true;                           // fc00::/7 (única-local)
  // IPv4 mapeada/embebida en IPv6 (::ffff:10.0.0.1 / ::ffff:7f00:1) — valida la parte v4.
  const mapped = v.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

/** ¿La IP resuelta cae en un rango que NO debemos alcanzar? */
function isBlockedIP(ip: string): boolean {
  return ip.includes(':') ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

/**
 * Valida que `raw` sea una URL pública segura para que el server la consulte.
 * Lanza Error('URL no permitida') si: no es http/https, trae credenciales,
 * el host es localhost/*.internal/*.local, o resuelve a una IP privada/interna.
 * Devuelve la URL ya parseada si pasa.
 */
export async function assertSafePublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(String(raw || '').trim());
  } catch {
    throw new Error('URL no permitida');
  }

  // Solo http/https (nada de file:, gopher:, ftp:, data:…).
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('URL no permitida');

  // Credenciales embebidas (http://user:pass@host) → fuera.
  if (url.username || url.password) throw new Error('URL no permitida');

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) throw new Error('URL no permitida');

  // Hostnames internos por nombre (no dependen del DNS).
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error('URL no permitida');
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) {
    throw new Error('URL no permitida');
  }

  // Si el host YA es una IP literal, valídala directo (sin DNS).
  if (isIpLiteral(host)) {
    if (isBlockedIP(host)) throw new Error('URL no permitida');
    return url;
  }

  // Resolución DNS: TODAS las IPs resueltas deben ser públicas (evita DNS rebinding
  // a primer vistazo y hosts que mapean a la red interna).
  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error('URL no permitida'); // no resuelve = no la tocamos
  }
  if (!records.length) throw new Error('URL no permitida');
  for (const r of records) {
    if (isBlockedIP(r.address)) throw new Error('URL no permitida');
  }

  return url;
}

/** ¿`host` es una IP literal (v4 o v6)? */
function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true; // IPv4
  if (host.includes(':')) return true;                                // IPv6
  return false;
}

interface SafeFetchOpts {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
}

/**
 * Hace fetch del TEXTO de una URL pública de forma segura: valida con
 * assertSafePublicUrl, sigue redirects revalidando CADA salto (redirect:'manual'),
 * y corta a ~15s con AbortController. Lanza Error('URL no permitida') si algún
 * salto apunta a la red interna. Devuelve el texto de la respuesta final.
 */
export async function safeFetchText(raw: string, opts: SafeFetchOpts = {}): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const maxRedirects = opts.maxRedirects ?? 5;
  const headers = opts.headers ?? { 'User-Agent': 'Mozilla/5.0 CactusBot' };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let current = await assertSafePublicUrl(raw);
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const res = await fetch(current.toString(), { headers, redirect: 'manual', signal: ctrl.signal });
      // 3xx con Location → revalida el destino antes de seguir (cierra SSRF vía redirect).
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) return ''; // redirect sin destino: nada que leer
        const next = new URL(loc, current); // resuelve relativos contra el actual
        current = await assertSafePublicUrl(next.toString());
        continue;
      }
      if (!res.ok) return '';
      return await res.text();
    }
    return ''; // demasiados redirects
  } finally {
    clearTimeout(timer);
  }
}
