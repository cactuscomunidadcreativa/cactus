import type { AIRequest, AIResponse, AIProviderAdapter } from './types';
import { getAPIKey, isProviderConfigured } from './config';

export const claudeAdapter: AIProviderAdapter = {
  id: 'claude',
  name: 'Claude (Anthropic)',

  async isConfigured() {
    return isProviderConfigured('claude');
  },

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('claude');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const start = Date.now();

    const messages: { role: string; content: string }[] = [];

    // Support multi-turn conversations
    if (request.messages && request.messages.length > 0) {
      for (const msg of request.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    } else {
      messages.push({ role: 'user', content: request.prompt });
    }

    const body: Record<string, unknown> = {
      model: request.model || 'claude-sonnet-4-6',
      max_tokens: request.maxTokens || 1024,
      messages,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    // NOTA: los modelos Claude 4.7/4.8 (y Fable) rechazan temperature/top_p/top_k
    // con error 400. No los enviamos; el comportamiento se guía por prompt.

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const durationMs = Date.now() - start;

    const text = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('') || '';

    return {
      content: text,
      provider: 'claude',
      model: data.model || 'claude-sonnet-4-6',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
    };
  },
};
