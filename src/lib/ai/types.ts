export type AIProvider = 'claude' | 'openai';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  provider?: AIProvider;
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
