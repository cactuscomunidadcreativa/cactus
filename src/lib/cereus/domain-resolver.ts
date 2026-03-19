import { createServiceClient } from '@/lib/supabase/service';

interface MaisonDomainEntry {
  maisonId: string;
  nombre: string;
  config: Record<string, unknown>;
  expiresAt: number;
}

const cache = new Map<string, MaisonDomainEntry | null>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const NEGATIVE_CACHE_TTL = 60 * 1000; // 1 minute for misses

/**
 * Known platform domains that should never be treated as custom maison domains.
 */
const PLATFORM_DOMAINS = [
  'localhost',
  'cactus.vercel.app',
  'cactuscomunidad.com',
  'cactuscreativa.com',
];

/**
 * Check if a hostname is a known platform domain (not a custom maison domain).
 */
export function isPlatformDomain(hostname: string): boolean {
  const bare = hostname.split(':')[0]; // strip port
  return PLATFORM_DOMAINS.some(d => bare === d || bare.endsWith(`.${d}`))
    || bare.endsWith('.vercel.app')
    || bare.endsWith('.vercel.sh');
}

/**
 * Resolve a hostname to a maison entry. Returns null if not a custom domain.
 * Uses in-memory cache to avoid DB hits on every request.
 */
export async function resolveMaisonDomain(
  hostname: string
): Promise<{ maisonId: string; nombre: string; config: Record<string, unknown> } | null> {
  const bare = hostname.split(':')[0];

  // Check cache
  const cached = cache.get(bare);
  if (cached !== undefined) {
    if (cached === null) {
      // Negative cache — check TTL
      return null;
    }
    if (Date.now() < cached.expiresAt) {
      return { maisonId: cached.maisonId, nombre: cached.nombre, config: cached.config };
    }
    // Expired — fall through to refresh
  }

  // Query DB
  const supabase = createServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('app_clients')
    .select('id, nombre, config')
    .eq('custom_domain', bare)
    .eq('activo', true)
    .limit(1)
    .single();

  if (error || !data) {
    // Cache negative result
    cache.set(bare, null);
    setTimeout(() => cache.delete(bare), NEGATIVE_CACHE_TTL);
    return null;
  }

  const entry: MaisonDomainEntry = {
    maisonId: data.id,
    nombre: data.nombre,
    config: (data.config as Record<string, unknown>) || {},
    expiresAt: Date.now() + CACHE_TTL,
  };

  cache.set(bare, entry);
  return { maisonId: entry.maisonId, nombre: entry.nombre, config: entry.config };
}

/**
 * CEREUS app routes that get rewritten on custom domains.
 * Maps clean path prefix → internal path.
 */
export const CEREUS_ROUTES = [
  'costing',
  'clients',
  'production',
  'closet',
  'advisor',
  'designer',
  'catalog',
] as const;
