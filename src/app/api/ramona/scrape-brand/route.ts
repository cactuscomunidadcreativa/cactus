import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeBrandFromUrl, scrapeMultipleSources } from '@/modules/ramona/lib/brand-scraper';

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
    const { urls } = body as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one URL to analyze' },
        { status: 400 }
      );
    }

    // Limit to 5 URLs max
    const limitedUrls = urls.slice(0, 5);

    // Single URL
    if (limitedUrls.length === 1) {
      const result = await scrapeBrandFromUrl(limitedUrls[0]);
      return NextResponse.json(result);
    }

    // Multiple URLs - merge results
    const result = await scrapeMultipleSources(limitedUrls);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Brand scrape API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}
