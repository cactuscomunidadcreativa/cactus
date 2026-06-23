import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// La generación de video real (voiceover + render) es Fase F y NO está implementada.
// Antes este endpoint SIMULABA un job "completado" con una URL placeholder
// (https://example.com/placeholder-video.mp4) — una mentira que podía terminar
// mostrándose como entregable real. Hasta cablear un proveedor real (Kling/Runway/
// Veo + Remotion), responde honestamente 501 en vez de fingir éxito.
export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(
    { error: 'La generación de video aún no está disponible.', notImplemented: true },
    { status: 501 },
  );
}

// GET: plantillas de video (datos reales de la BD; sin IA). Se conserva.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('rm_video_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('Video templates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video templates' },
      { status: 500 }
    );
  }
}
