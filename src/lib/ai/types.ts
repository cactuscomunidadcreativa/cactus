export type AIProvider = 'claude' | 'openai' | 'gemini';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  provider?: AIProvider;
  /** id de modelo explícito; si se omite, el adapter usa su modelo por defecto */
  model?: string;
  /** perfil de presupuesto; el router lo traduce a un modelo concreto */
  tier?: 'economico' | 'equilibrado' | 'maxima';
  maxTokens?: number;
  temperature?: number;
  messages?: AIChatMessage[];
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface AIProviderAdapter {
  id: AIProvider;
  name: string;
  isConfigured: () => Promise<boolean>;
  generate: (request: AIRequest) => Promise<AIResponse>;
}

export interface AIStatus {
  available: boolean;
  providers: {
    id: AIProvider;
    name: string;
    configured: boolean;
  }[];
  defaultProvider: AIProvider;
}
