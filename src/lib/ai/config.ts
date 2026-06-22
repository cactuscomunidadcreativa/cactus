import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AIProvider } from './types';
import { decryptSecret } from '@/lib/cactus/crypto';

interface AIConfig {
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  klingApiKey: string;
  klingSecretKey: string;
  sunoApiKey: string;
  elevenLabsApiKey: string;
  replicateApiKey: string;
  piapiApiKey: string;
  defaultProvider: AIProvider;
  fallbackEnabled: boolean;
  globalMonthlyTokenLimit: number;
  globalMonthlyGenerationLimit: number;
}

// Simple in-memory cache with TTL
let cachedConfig: AIConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadConfigFromDB(): Promise<Record<string, string>> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) return {};

    const cookieStore = await cookies();
    const supabase = createServerClient(url, serviceKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    });

    const { data } = await supabase
      .from('platform_config')
      .select('key, value, encrypted');

    if (!data) return {};

    const config: Record<string, string> = {};
    for (const row of data) {
      let v: string = row.value;
      // Descifra las llaves marcadas como cifradas. Si decryptSecret devuelve null
      // (sin CACTUS_SECRETS_KEY, o fila legacy guardada en texto plano pero con el
      // flag encrypted:true del código viejo) → usa el valor crudo (compatibilidad).
      if (row.encrypted && v) {
        const dec = decryptSecret(v);
        if (dec !== null) v = dec;
      }
      config[row.key] = v;
    }
    return config;
  } catch (error) {
    console.error('Failed to load AI config from DB:', error);
    return {};
  }
}

export async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig;
  }

  const dbConfig = await loadConfigFromDB();

  const config: AIConfig = {
    anthropicApiKey: dbConfig['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: dbConfig['openai_api_key'] || process.env.OPENAI_API_KEY || '',
    geminiApiKey: dbConfig['google_ai_api_key'] || dbConfig['gemini_api_key'] || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
    klingApiKey: dbConfig['kling_api_key'] || process.env.KLING_API_KEY || '',
    klingSecretKey: dbConfig['kling_secret_key'] || process.env.KLING_SECRET_KEY || '',
    sunoApiKey: dbConfig['suno_api_key'] || process.env.SUNO_API_KEY || '',
    elevenLabsApiKey: dbConfig['elevenlabs_api_key'] || process.env.ELEVENLABS_API_KEY || '',
    replicateApiKey: dbConfig['replicate_api_token'] || process.env.REPLICATE_API_TOKEN || '',
    piapiApiKey: dbConfig['piapi_api_key'] || process.env.PIAPI_API_KEY || '',
    defaultProvider: (dbConfig['ai_default_provider'] || process.env.AI_DEFAULT_PROVIDER || 'claude') as AIProvider,
    fallbackEnabled: (dbConfig['ai_fallback_enabled'] ?? process.env.AI_FALLBACK_ENABLED ?? 'true') !== 'false',
    globalMonthlyTokenLimit: parseInt(dbConfig['global_monthly_token_limit'] || '-1', 10),
    globalMonthlyGenerationLimit: parseInt(dbConfig['global_monthly_generation_limit'] || '-1', 10),
  };

  cachedConfig = config;
  cacheExpiry = now + CACHE_TTL_MS;

  return config;
}

export async function getAPIKey(provider: AIProvider): Promise<string> {
  const config = await getAIConfig();
  if (provider === 'claude') return config.anthropicApiKey;
  if (provider === 'gemini') return config.geminiApiKey;
  return config.openaiApiKey;
}

/** Llave de una integración no-LLM-de-texto (video, música, voz). */
export async function getIntegrationKey(name: 'kling' | 'kling-secret' | 'suno' | 'elevenlabs' | 'replicate' | 'piapi'): Promise<string> {
  const config = await getAIConfig();
  if (name === 'kling') return config.klingApiKey;
  if (name === 'kling-secret') return config.klingSecretKey;
  if (name === 'suno') return config.sunoApiKey;
  if (name === 'elevenlabs') return config.elevenLabsApiKey;
  if (name === 'replicate') return config.replicateApiKey;
  if (name === 'piapi') return config.piapiApiKey;
  return '';
}

export async function isProviderConfigured(provider: AIProvider): Promise<boolean> {
  const key = await getAPIKey(provider);
  return !!key;
}

export function clearConfigCache(): void {
  cachedConfig = null;
  cacheExpiry = 0;
}
