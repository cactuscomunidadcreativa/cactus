import type { AIRequest, AIResponse, AIStatus, AIProvider, AIChatMessage } from './types';
import {
  getDefaultProvider,
  getAdapter,
  getConfiguredProviders,
  getFallbackProvider,
} from './provider-factory';

export type { AIRequest, AIResponse, AIStatus, AIProvider, AIChatMessage };

export async function generateContent(request: AIRequest): Promise<AIResponse> {
  const provider = request.provider || await getDefaultProvider();
  const adapter = getAdapter(provider);

  if (!(await adapter.isConfigured())) {
    const fallback = await getFallbackProvider(provider);
    if (fallback) {
      return getAdapter(fallback).generate(request);
    }
    throw new Error('No AI provider configured. Add API keys in Admin panel or .env.local');
  }

  try {
    return await adapter.generate(request);
  } catch (error) {
    const fallback = await getFallbackProvider(provider);
    if (fallback) {
      return getAdapter(fallback).generate(request);
    }
    throw error;
  }
}

export async function generateChat(params: {
  messages: AIChatMessage[];
  systemPrompt: string;
  provider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
}): Promise<AIResponse> {
  return generateContent({
    prompt: params.messages[params.messages.length - 1]?.content || '',
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    provider: params.provider,
    maxTokens: params.maxTokens || 1024,
    temperature: params.temperature ?? 0.7,
  });
}

export async function getAIStatus(): Promise<AIStatus> {
  const configured = await getConfiguredProviders();
  const defaultProvider = await getDefaultProvider();

  return {
    available: configured.length > 0,
    providers: [
      { id: 'claude', name: 'Claude (Anthropic)', configured: configured.includes('claude') },
      { id: 'openai', name: 'OpenAI', configured: configured.includes('openai') },
    ],
    defaultProvider,
  };
}
