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

  // gpt-image-1 usa tamaños distintos a dall-e-3 → mapear
  const SIZE_MAP: Record<string, string> = {
    '1024x1024': '1024x1024',
    '1024x1792': '1024x1536',
    '1792x1024': '1536x1024',
  };
  const size = SIZE_MAP[request.size || '1024x1024'] || '1024x1024';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: request.prompt,
      n: 1,
      size,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const image = data.data?.[0];

  // La API puede devolver una URL temporal o base64 (según el modelo de la cuenta)
  let url: string | undefined = image?.url;
  if (!url && image?.b64_json) url = `data:image/png;base64,${image.b64_json}`;

  if (!url) {
    throw new Error('DALL-E returned no image');
  }

  return {
    url,
    revisedPrompt: image.revised_prompt || request.prompt,
  };
}

/**
 * Edit an existing image with a text instruction (gpt-image-1 /images/edits).
 * Recibe la imagen como Blob (multipart) y devuelve la imagen editada (url o base64).
 */
export async function editImage(opts: {
  image: Blob;
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
}): Promise<ImageGenerationResponse> {
  const configured = await isProviderConfigured('openai');
  if (!configured) throw new Error('OpenAI API key not configured — cannot edit images');
  const apiKey = await getAPIKey('openai');

  const SIZE_MAP: Record<string, string> = {
    '1024x1024': '1024x1024',
    '1024x1792': '1024x1536',
    '1792x1024': '1536x1024',
  };
  const size = SIZE_MAP[opts.size || '1024x1024'] || '1024x1024';

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', opts.prompt);
  form.append('n', '1');
  form.append('size', size);
  form.append('image', opts.image, 'image.png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` }, // sin Content-Type: FormData pone el boundary
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image edit API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const image = data.data?.[0];
  let url: string | undefined = image?.url;
  if (!url && image?.b64_json) url = `data:image/png;base64,${image.b64_json}`;
  if (!url) throw new Error('La edición no devolvió imagen');
  return { url, revisedPrompt: image.revised_prompt || opts.prompt };
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
