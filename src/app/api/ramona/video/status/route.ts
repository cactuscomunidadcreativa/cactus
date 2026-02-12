import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const brandId = searchParams.get('brandId');

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('rm_video_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ job });
    }

    if (brandId) {
      // Get all jobs for brand
      const { data: jobs, error } = await supabase
        .from('rm_video_jobs')
        .select('*')
        .eq('brand_id', brandId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
      }

      return NextResponse.json({ jobs: jobs || [] });
    }

    return NextResponse.json({ error: 'jobId or brandId required' }, { status: 400 });

  } catch (error) {
    console.error('Video status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get video status' },
      { status: 500 }
    );
  }
}
