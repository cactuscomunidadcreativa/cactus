import { SupabaseClient } from '@supabase/supabase-js'

interface UploadResult {
  permanentUrl: string | null
  warning: string | null
  error: string | null
}

/**
 * Download a DALL-E image and upload to Supabase storage with retry logic.
 * Returns a permanent public URL or falls back with a warning.
 */
export async function uploadImageToSupabase(
  db: SupabaseClient,
  imageUrl: string,
  folder: string,
  maxRetries = 3
): Promise<UploadResult> {
  let buffer: ArrayBuffer

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { permanentUrl: null, warning: null, error: `Failed to download image: ${response.status}` }
    }
    buffer = await response.arrayBuffer()
  } catch (err) {
    return { permanentUrl: null, warning: null, error: `Failed to download image: ${err}` }
  }

  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { error } = await db.storage
      .from('cereus-garment-images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (!error) {
      const { data: urlData } = db.storage
        .from('cereus-garment-images')
        .getPublicUrl(filePath)

      return { permanentUrl: urlData.publicUrl, warning: null, error: null }
    }

    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }

  // All retries failed — return the original URL with a warning
  return {
    permanentUrl: imageUrl,
    warning: 'Imagen guardada temporalmente. Puede expirar — regenera si desaparece.',
    error: null,
  }
}
