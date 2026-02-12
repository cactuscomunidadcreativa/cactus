import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get app page content (public)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const app_id = searchParams.get('app');
  const locale = searchParams.get('locale') || 'es';

  try {
    if (app_id) {
      // Single app page
      const { data, error } = await supabase
        .from('cms_app_pages')
        .select('*')
        .eq('app_id', app_id)
        .eq('locale', locale)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return NextResponse.json({ page: data });
    }

    // All app pages
    const { data, error } = await supabase
      .from('cms_app_pages')
      .select('*')
      .eq('locale', locale)
      .eq('active', true);

    if (error) throw error;

    return NextResponse.json({ pages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create/Update app page (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { app_id, locale = 'es', ...content } = body;

    const { data, error } = await supabase
      .from('cms_app_pages')
      .upsert({
        app_id,
        locale,
        ...content,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'app_id,locale',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, page: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
