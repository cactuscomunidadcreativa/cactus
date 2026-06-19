import type { AIRequest, AIResponse, AIStatus, AIProvider, AIChatMessage } from './types';
import {
  getDefaultProvider,
  getAdapter,
  getConfiguredProviders,
  getFallbackProvider,
} from './provider-factory';
import { modelForTier } from '@/lib/cactus/budget';

export type { AIRequest, AIResponse, AIStatus, AIProvider, AIChatMessage };
export { generateImage, generateImages, editImage } from './image';
export type { ImageGenerationRequest, ImageGenerationResponse } from './image';

/** Aplica el perfil de presupuesto (tier) -> modelo concreto del proveedor dado. */
function withTierModel(request: AIRequest, provider: AIProvider): AIRequest {
  if (request.model || !request.tier) return request;
  const model = modelForTier(provider, request.tier);
  return model ? { ...request, model } : request;
}

export async function generateContent(request: AIRequest): Promise<AIResponse> {
  const provider = request.provider || await getDefaultProvider();
  const adapter = getAdapter(provider);

  if (!(await adapter.isConfigured())) {
    const fallback = await getFallbackProvider(provider);
    if (fallback) {
      return getAdapter(fallback).generate(withTierModel(request, fallback));
    }
    throw new Error('No AI provider configured. Add API keys in Admin panel or .env.local');
  }

  try {
    return await adapter.generate(withTierModel(request, provider));
  } catch (error) {
    const fallback = await getFallbackProvider(provider);
    if (fallback) {
      return getAdapter(fallback).generate(withTierModel(request, fallback));
    }
    throw error;
  }
}

export async function generateChat(params: {
  messages: AIChatMessage[];
  systemPrompt: string;
  provider?: AIProvider;
  tier?: AIRequest['tier'];
  maxTokens?: number;
  temperature?: number;
}): Promise<AIResponse> {
  return generateContent({
    prompt: params.messages[params.messages.length - 1]?.content || '',
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    provider: params.provider,
    tier: params.tier,
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
      { id: 'gemini', name: 'Google AI (Gemini)', configured: configured.includes('gemini') },
    ],
    defaultProvider,
  };
}
