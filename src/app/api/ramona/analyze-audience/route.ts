import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  analyzeAudienceFromProfiles,
  generateAudienceFromDescription,
} from '@/modules/ramona/lib/audience-analyzer';

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
    const { mode, profileUrls, productOrService, targetDescription, businessContext } = body as {
      mode: 'profiles' | 'description';
      profileUrls?: string[];
      productOrService?: string;
      targetDescription?: string;
      businessContext?: string;
    };

    if (mode === 'profiles') {
      if (!profileUrls || !Array.isArray(profileUrls) || profileUrls.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one profile URL' },
          { status: 400 }
        );
      }

      // Limit to 5 profiles max
      const limitedProfiles = profileUrls.slice(0, 5);
      const result = await analyzeAudienceFromProfiles(limitedProfiles, businessContext);
      return NextResponse.json(result);
    }

    if (mode === 'description') {
      if (!productOrService || !targetDescription) {
        return NextResponse.json(
          { error: 'Please provide product/service and target description' },
          { status: 400 }
        );
      }

      const result = await generateAudienceFromDescription(productOrService, targetDescription);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "profiles" or "description"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Audience analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audience' },
      { status: 500 }
    );
  }
}
