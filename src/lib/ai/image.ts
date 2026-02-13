/**
 * DALL-E Image Generation
 * Uses OpenAI's DALL-E 3 API for generating images.
 * Reuses the same OpenAI API key from the AI config.
 */

import { getAPIKey, isProviderConfigured } from './config';

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt: string;
}

/**
 * Generate a single image using DALL-E 3.
 * Returns a temporary URL (valid ~1 hour) — download and re-upload to permanent storage.
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const configured = await isProviderConfigured('openai');
  if (!configured) {
    throw new Error('OpenAI API key not configured — cannot generate images');
  }

  const apiKey = await getAPIKey('openai');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: request.prompt,
      n: 1,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const image = data.data?.[0];

  if (!image?.url) {
    throw new Error('DALL-E returned no image');
  }

  return {
    url: image.url,
    revisedPrompt: image.revised_prompt || request.prompt,
  };
}

/**
 * Generate multiple images in parallel.
 * Returns only the successful results (skips failed ones).
 */
export async function generateImages(
  prompts: string[],
  options?: Omit<ImageGenerationRequest, 'prompt'>
): Promise<ImageGenerationResponse[]> {
  const results = await Promise.allSettled(
    prompts.map(prompt =>
      generateImage({ prompt, ...options })
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ImageGenerationResponse> => r.status === 'fulfilled')
    .map(r => r.value);
}
