import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface VideoConfig {
  brandId: string;
  script: string;
  videoType: 'text-to-video' | 'avatar' | 'faceless' | 'carousel';
  style: {
    template?: string;
    colors?: string[];
    font?: string;
    transitions?: string[];
    aspectRatio?: '9:16' | '16:9' | '1:1';
    musicStyle?: string;
  };
  contentId?: string; // Optional: create from existing content
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = body as VideoConfig;

    // Validate required fields
    if (!config.brandId || !config.script || !config.videoType) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, script, videoType' },
        { status: 400 }
      );
    }

    // Validate script length
    if (config.script.length < 10) {
      return NextResponse.json(
        { error: 'Script must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (config.script.length > 5000) {
      return NextResponse.json(
        { error: 'Script must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Verify brand ownership
    const { data: brand, error: brandError } = await supabase
      .from('rm_brands')
      .select('id, name')
      .eq('id', config.brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Create video job
    const { data: videoJob, error: jobError } = await supabase
      .from('rm_video_jobs')
      .insert({
        brand_id: config.brandId,
        user_id: user.id,
        content_id: config.contentId || null,
        script: config.script,
        video_type: config.videoType,
        style: config.style || {},
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (jobError || !videoJob) {
      console.error('Failed to create video job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create video job' },
        { status: 500 }
      );
    }

    // In production, this would trigger a background job to:
    // 1. Generate voiceover using ElevenLabs/PlayHT
    // 2. Render video using Remotion
    // 3. Upload to storage
    // 4. Update job with URLs

    // For now, simulate the process
    simulateVideoGeneration(supabase, videoJob.id).catch(console.error);

    return NextResponse.json({
      success: true,
      jobId: videoJob.id,
      message: 'Video generation started',
      estimatedTime: '2-5 minutes',
    });

  } catch (error) {
    console.error('Video generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}

// GET: Fetch video templates
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

// Simulate video generation (placeholder)
async function simulateVideoGeneration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string
) {
  if (!supabase) return;

  // Update to processing
  await supabase
    .from('rm_video_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), progress: 10 })
    .eq('id', jobId);

  // Simulate progress updates
  const progressSteps = [20, 40, 60, 80, 90];
  for (const progress of progressSteps) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from('rm_video_jobs')
      .update({ progress, status: progress >= 80 ? 'rendering' : 'processing' })
      .eq('id', jobId);
  }

  // Complete with placeholder URL
  await new Promise(resolve => setTimeout(resolve, 2000));
  await supabase
    .from('rm_video_jobs')
    .update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      video_url: 'https://example.com/placeholder-video.mp4', // Placeholder
      thumbnail_url: 'https://example.com/placeholder-thumb.jpg', // Placeholder
      duration_seconds: 15,
    })
    .eq('id', jobId);
}
