import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  analyzeMultipleSocialProfiles,
  analyzeReferentBrands,
} from '@/modules/ramona/lib/social-scraper';

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
    const { profiles, referents, context, mode } = body as {
      profiles?: string[];
      referents?: string[];
      context?: string;
      mode: 'social' | 'referents';
    };

    if (mode === 'social') {
      if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one social profile URL' },
          { status: 400 }
        );
      }

      // Limit to 5 profiles max
      const limitedProfiles = profiles.slice(0, 5);
      const result = await analyzeMultipleSocialProfiles(limitedProfiles, context);
      return NextResponse.json(result);
    }

    if (mode === 'referents') {
      if (!referents || !Array.isArray(referents) || referents.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one referent URL' },
          { status: 400 }
        );
      }

      // Limit to 5 referents max
      const limitedReferents = referents.slice(0, 5);
      const result = await analyzeReferentBrands(limitedReferents, context);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "social" or "referents"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Social scrape API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze social profiles' },
      { status: 500 }
    );
  }
}
