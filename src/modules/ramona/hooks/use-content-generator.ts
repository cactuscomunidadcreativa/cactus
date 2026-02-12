'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SocialPlatform, ContentType, AIProviderType } from '../types';

interface GenerateParams {
  topic: string;
  platform: SocialPlatform;
  contentType: ContentType;
  brandId: string;
  systemPrompt: string;
}

interface GenerationResult {
  content: string;
  provider: AIProviderType;
  model: string;
  generationId: string;
}

export function useContentGenerator() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generate = useCallback(async (params: GenerateParams) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.topic,
          systemPrompt: params.systemPrompt,
          brandId: params.brandId,
          platform: params.platform,
          contentType: params.contentType,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      const genResult: GenerationResult = {
        content: data.content,
        provider: data.provider,
        model: data.model,
        generationId: data.generationId,
      };
      setResult(genResult);
      return genResult;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, generating, result, error, reset };
}
