import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const presentationId = formData.get('presentationId') as string;
    const sectionId = formData.get('sectionId') as string;
    const reviewerId = formData.get('reviewerId') as string;
    const reviewerName = formData.get('reviewerName') as string;
    const threadId = formData.get('threadId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file || !sectionId || !reviewerName) {
      return NextResponse.json({ error: 'file, sectionId, and reviewerName required' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      // Dev mode: return mock attachment
      const mockAttachment = {
        id: `dev_${Date.now()}`,
        thread_id: threadId || null,
        section_id: sectionId,
        presentation_id: presentationId,
        reviewer_id: reviewerId || `dev_reviewer`,
        reviewer_name: reviewerName,
        file_name: file.name,
        file_url: `/dev-uploads/${file.name}`,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, attachment: mockAttachment });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${presentationId}/${sectionId}/${timestamp}_${safeName}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('pita-uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pita-uploads')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Create DB record
    const { data, error } = await supabase
      .from('pita_attachments')
      .insert({
        thread_id: threadId || null,
        section_id: sectionId,
        presentation_id: presentationId,
        reviewer_id: reviewerId || `anon_${Date.now()}`,
        reviewer_name: reviewerName,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, attachment: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get('presentationId');
    const sectionId = searchParams.get('sectionId');

    if (!presentationId) {
      return NextResponse.json({ error: 'presentationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ attachments: [] });
    }

    let query = supabase
      .from('pita_attachments')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: true });

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attachments: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
