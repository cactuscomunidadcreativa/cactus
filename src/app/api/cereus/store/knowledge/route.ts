import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_chatbot_knowledge')
    .select('*')
    .eq('maison_id', maisonId)
    .order('category')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalTokens = (data || []).reduce((sum, d) => sum + (d.tokens_estimate || 0), 0);
  return NextResponse.json({ knowledge: data || [], totalTokens });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { maisonId, ...knowledgeData } = body;

  // Estimate tokens (~4 chars per token)
  knowledgeData.tokens_estimate = Math.ceil((knowledgeData.content || '').length / 4);

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_chatbot_knowledge')
    .insert({ maison_id: maisonId, ...knowledgeData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (updates.content) {
    updates.tokens_estimate = Math.ceil(updates.content.length / 4);
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_chatbot_knowledge')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { error } = await service.from('cereus_chatbot_knowledge').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
