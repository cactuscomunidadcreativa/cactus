import { createServerClient } from '@supabase/ssr';
import { generateContent } from '@/lib/ai';
import { buildRamonaSystemPrompt } from '@/modules/ramona/lib/ramona-personality';

const getSupabase = () => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { getAll: () => [], setAll: () => {} } }
);

/**
 * Ramona handler: generate marketing content via WhatsApp.
 */
export async function handleRamonaMessage(
  userId: string,
  action: string,
  data?: string
): Promise<string> {
  const supabase = getSupabase();

  switch (action) {
    case 'activate':
      return '🌵 Modo Ramona activado.\nDime qué contenido necesitas o "menu" para volver.';

    case 'generate': {
      if (!data) return '🌵 Escribe: post [tema del contenido]';

      // Find user's active brand
      const { data: brand } = await supabase
        .from('rm_brands')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!brand) {
        return '🌵 No tienes una marca configurada. Crea una desde la plataforma primero.';
      }

      try {
        const systemPrompt = buildRamonaSystemPrompt(brand);
        const result = await generateContent({
          prompt: `Genera un post para redes sociales sobre: ${data}\n\nFormato: Solo el contenido listo para publicar, con hashtags.`,
          systemPrompt,
          maxTokens: 512,
          temperature: 0.7,
        });

        // Clean content markers
        const content = result.content
          .replace(/\[CONTENT_READY\]/g, '')
          .replace(/\[\/CONTENT_READY\]/g, '')
          .trim();

        return `🌵 Contenido generado:\n\n${content}\n\n(Responde "guardar" para guardarlo en tu pipeline)`;
      } catch {
        return '🌵 Error generando contenido. Verifica la configuración de IA en la plataforma.';
      }
    }

    case 'message':
      // General message in Ramona mode — treat as generation request
      if (data) {
        return handleRamonaMessage(userId, 'generate', data);
      }
      return '🌵 Modo Ramona. Dime qué contenido necesitas o "menu" para volver.';

    default:
      return '🌵 Modo Ramona. Dime qué contenido necesitas o "menu" para volver.';
  }
}
