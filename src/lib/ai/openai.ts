import type { AIRequest, AIResponse, AIProviderAdapter } from './types';
import { getAPIKey, isProviderConfigured } from './config';

export const openaiAdapter: AIProviderAdapter = {
  id: 'openai',
  name: 'OpenAI',

  async isConfigured() {
    return isProviderConfigured('openai');
  },

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('openai');
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const start = Date.now();

    const messages: { role: string; content: string }[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    // Support multi-turn conversations
    if (request.messages && request.messages.length > 0) {
      for (const msg of request.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    } else {
      messages.push({ role: 'user', content: request.prompt });
    }

    // Timeout: corta el fetch a ~30s para que el proveedor no cuelgue la serverless.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4o-mini',
          messages,
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature ?? 0.7,
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw new Error('timeout del proveedor OpenAI');
      throw e;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const durationMs = Date.now() - start;

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: 'openai',
      model: data.model || 'gpt-4o-mini',
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      durationMs,
    };
  },
};
