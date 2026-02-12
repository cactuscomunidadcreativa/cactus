import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List blog posts (public gets published, admin gets all)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);

  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const app_id = searchParams.get('app');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const locale = searchParams.get('locale') || 'es';

  // Check if admin for unpublished access
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'super_admin';
  }

  try {
    // Single post by slug
    if (slug) {
      let query = supabase
        .from('cms_blog_posts')
        .select('*')
        .eq('slug', slug);

      if (!isAdmin) {
        query = query.eq('published', true);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        throw error;
      }

      // Increment views for public
      if (!isAdmin && data) {
        await supabase
          .from('cms_blog_posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id);
      }

      return NextResponse.json({ post: data });
    }

    // List posts
    let query = supabase
      .from('cms_blog_posts')
      .select('id, slug, title, excerpt, cover_image, author_name, category, tags, app_id, featured, published, published_at, created_at, views')
      .eq('locale', locale)
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (!isAdmin) {
      query = query.eq('published', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ posts: data, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create blog post (admin only)
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
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      category,
      tags,
      app_id,
      featured,
      published,
      locale = 'es',
    } = body;

    // Generate slug if not provided
    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('cms_blog_posts')
      .insert({
        title,
        slug: finalSlug,
        excerpt,
        content,
        cover_image,
        author_id: user.id,
        author_name: profile?.full_name || 'Admin',
        category,
        tags: tags || [],
        app_id,
        featured: featured || false,
        published: published || false,
        published_at: published ? new Date().toISOString() : null,
        locale,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update blog post (admin only)
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    // Handle publishing
    if (updates.published && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('cms_blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete blog post (admin only)
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('cms_blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
