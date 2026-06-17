import type { AIProvider, AIProviderAdapter } from './types';
import { claudeAdapter } from './claude';
import { openaiAdapter } from './openai';
import { geminiAdapter } from './gemini';
import { getAIConfig } from './config';

const adapters: Record<AIProvider, AIProviderAdapter> = {
  claude: claudeAdapter,
  openai: openaiAdapter,
  gemini: geminiAdapter,
};

export async function getDefaultProvider(): Promise<AIProvider> {
  const config = await getAIConfig();
  return config.defaultProvider;
}

export function getAdapter(provider: AIProvider): AIProviderAdapter {
  return adapters[provider];
}

export async function getConfiguredProviders(): Promise<AIProvider[]> {
  const results = await Promise.all(
    (Object.keys(adapters) as AIProvider[]).map(async (id) => ({
      id,
      configured: await adapters[id].isConfigured(),
    }))
  );
  return results.filter((r) => r.configured).map((r) => r.id);
}

export async function isFallbackEnabled(): Promise<boolean> {
  const config = await getAIConfig();
  return config.fallbackEnabled;
}

export async function getFallbackProvider(primary: AIProvider): Promise<AIProvider | null> {
  const enabled = await isFallbackEnabled();
  if (!enabled) return null;
  // Primer proveedor configurado que NO sea el primario (orden: claude, openai, gemini)
  const order: AIProvider[] = ['claude', 'openai', 'gemini'];
  for (const id of order) {
    if (id === primary) continue;
    if (await adapters[id].isConfigured()) return id;
  }
  return null;
}
