import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch CMS content by section
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');
  const locale = searchParams.get('locale') || 'es';

  try {
    if (section) {
      // Single section
      const { data, error } = await supabase
        .from('cms_content')
        .select('*')
        .eq('active', true)
        .eq('section', section)
        .eq('locale', locale)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return NextResponse.json({ content: data });
    }

    // All content for locale
    const { data, error } = await supabase
      .from('cms_content')
      .select('*')
      .eq('active', true)
      .eq('locale', locale);

    if (error) throw error;

    return NextResponse.json({ content: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create/Update CMS content (admin only)
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
    const { section, locale = 'es', content } = body;

    const { data, error } = await supabase
      .from('cms_content')
      .upsert({
        section,
        locale,
        content,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'section,locale',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
