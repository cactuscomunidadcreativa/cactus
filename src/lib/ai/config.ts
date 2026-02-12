import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AIProvider } from './types';

interface AIConfig {
  anthropicApiKey: string;
  openaiApiKey: string;
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
      .select('key, value');

    if (!data) return {};

    const config: Record<string, string> = {};
    for (const row of data) {
      config[row.key] = row.value;
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
  return provider === 'claude' ? config.anthropicApiKey : config.openaiApiKey;
}

export async function isProviderConfigured(provider: AIProvider): Promise<boolean> {
  const key = await getAPIKey(provider);
  return !!key;
}

export function clearConfigCache(): void {
  cachedConfig = null;
  cacheExpiry = 0;
}
