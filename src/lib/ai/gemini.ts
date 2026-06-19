import type { AIRequest, AIResponse, AIProviderAdapter } from './types';
import { getAPIKey, isProviderConfigured } from './config';

const MODEL = 'gemini-2.0-flash';

export const geminiAdapter: AIProviderAdapter = {
  id: 'gemini',
  name: 'Google AI (Gemini)',

  async isConfigured() {
    return isProviderConfigured('gemini');
  },

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('gemini');
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

    const start = Date.now();
    const model = request.model || MODEL;

    // Construir contents (multi-turno o prompt simple)
    const contents: { role: string; parts: { text: string }[] }[] = [];
    if (request.messages && request.messages.length > 0) {
      for (const msg of request.messages) {
        contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
      }
    } else {
      contents.push({ role: 'user', parts: [{ text: request.prompt }] });
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens || 1024,
      },
    };
    if (request.systemPrompt) {
      body.systemInstruction = { parts: [{ text: request.systemPrompt }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const durationMs = Date.now() - start;

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || '';

    return {
      content: text,
      provider: 'gemini',
      model,
      inputTokens: data.usageMetadata?.promptTokenCount || 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      durationMs,
    };
  },
};
