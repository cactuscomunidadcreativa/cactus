import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/ai';

interface BatchConfig {
  count: number;
  platforms: string[];
  types: string[];
  themes?: string[];
}

interface Brand {
  id: string;
  name: string;
  industry: string;
  tone: string[];
  keywords: string[];
  voice_profile: {
    forbidden_words?: string[];
    example_content?: string;
  };
  audience: {
    age_range?: string;
    interests?: string;
    pain_points?: string;
  };
  value_proposition?: string;
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
    const { brandId, config } = body as { brandId: string; config: BatchConfig };

    if (!brandId || !config) {
      return NextResponse.json(
        { error: 'Missing brandId or config' },
        { status: 400 }
      );
    }

    // Validate config
    if (!config.count || config.count < 1 || config.count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (!config.platforms || config.platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Get brand data
    const { data: brand, error: brandError } = await supabase
      .from('rm_brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Create batch job
    const { data: batchJob, error: jobError } = await supabase
      .from('rm_batch_jobs')
      .insert({
        brand_id: brandId,
        user_id: user.id,
        status: 'processing',
        config,
        total: config.count,
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !batchJob) {
      console.error('Failed to create batch job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create batch job' },
        { status: 500 }
      );
    }

    // Start background generation (fire and forget)
    generateBatchContent(supabase, batchJob.id, brand as Brand, config).catch(
      (error) => {
        console.error('Batch generation failed:', error);
        supabase
          .from('rm_batch_jobs')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchJob.id)
          .then(() => {});
      }
    );

    return NextResponse.json({
      success: true,
      jobId: batchJob.id,
      message: `Started generating ${config.count} content pieces`,
    });

  } catch (error) {
    console.error('Batch generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to start batch generation' },
      { status: 500 }
    );
  }
}

// GET: Check batch job status
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
        .from('rm_batch_jobs')
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
        .from('rm_batch_jobs')
        .select('*')
        .eq('brand_id', brandId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
      }

      return NextResponse.json({ jobs: jobs || [] });
    }

    return NextResponse.json({ error: 'jobId or brandId required' }, { status: 400 });

  } catch (error) {
    console.error('Batch status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    );
  }
}

// Background function to generate content
async function generateBatchContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  brand: Brand,
  config: BatchConfig
) {
  if (!supabase) throw new Error('Supabase client not available');

  const { count, platforms, types, themes } = config;

  // Build context for AI
  const brandContext = `
Marca: ${brand.name}
Industria: ${brand.industry}
Tono: ${brand.tone?.join(', ') || 'profesional'}
Palabras clave: ${brand.keywords?.join(', ') || ''}
Propuesta de valor: ${brand.value_proposition || ''}
Audiencia: ${brand.audience?.age_range || ''}, intereses: ${brand.audience?.interests || ''}
Problemas que resuelve: ${brand.audience?.pain_points || ''}
${brand.voice_profile?.forbidden_words?.length ? `Palabras prohibidas: ${brand.voice_profile.forbidden_words.join(', ')}` : ''}
`.trim();

  const platformsStr = platforms.join(', ');
  const typesStr = types?.length ? types.join(', ') : 'post, story';
  const themesStr = themes?.length ? themes.join(', ') : 'variado';

  // Generate content in batches of 5 for efficiency
  const batchSize = 5;
  const batches = Math.ceil(count / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const remaining = count - batch * batchSize;
    const currentBatch = Math.min(batchSize, remaining);

    const prompt = `Genera ${currentBatch} piezas de contenido diferentes para redes sociales.

Contexto de marca:
${brandContext}

Plataformas: ${platformsStr}
Tipos de contenido: ${typesStr}
Temas sugeridos: ${themesStr}

Para cada pieza genera:
1. Un título interno corto (3-5 palabras)
2. El contenido completo listo para publicar
3. 3-5 hashtags relevantes
4. La plataforma más adecuada
5. El tipo de contenido

IMPORTANTE:
- Varía los temas y enfoques
- Adapta el contenido a cada plataforma
- Mantén el tono de la marca
- No repitas ideas

Responde SOLO con un JSON array válido (sin markdown):
[
  {
    "title": "título interno",
    "content": "contenido completo",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "platform": "${platforms[0]}",
    "type": "${types?.[0] || 'post'}"
  }
]`;

    try {
      const result = await generateContent({
        prompt,
        systemPrompt: 'Eres un experto en social media marketing. Generas contenido auténtico y engaging que mantiene la voz de marca.',
        maxTokens: 3000,
      });

      // Parse response
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        continue;
      }

      const contents = JSON.parse(jsonMatch[0]);

      // Save each content
      for (const item of contents) {
        await supabase.from('rm_contents').insert({
          brand_id: brand.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          batch_job_id: jobId,
          title: item.title || 'Sin título',
          body: item.content,
          platform: item.platform || platforms[0],
          content_type: item.type || 'post',
          hashtags: item.hashtags || [],
          status: 'idea',
          ai_generated: true,
        });
      }

      // Update progress
      const currentProgress = (batch + 1) * batchSize;
      await supabase
        .from('rm_batch_jobs')
        .update({ progress: Math.min(currentProgress, count) })
        .eq('id', jobId);

    } catch (error) {
      console.error(`Batch ${batch + 1} generation error:`, error);
      // Continue with next batch
    }

    // Small delay between batches to avoid rate limiting
    if (batch < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Mark as completed
  await supabase
    .from('rm_batch_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}
