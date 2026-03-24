import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// ─── TYPES ──────────────────────────────────────────────────

export interface AITrainingData {
  // Brand Identity
  brandVoice: string;
  brandValues: string[];
  targetAudience: string;

  // Style Preferences
  styleKeywords: string[];
  avoidKeywords: string[];

  // Color Preferences
  preferredColors: string[];
  avoidColors: string[];
  skinToneContext: string;

  // Fabric Preferences
  preferredFabrics: string[];
  avoidFabrics: string[];

  // Body/Fit Preferences
  bodyContext: string;
  fitPreferences: string;

  // Design Rules
  designRules: string;

  // Inspiration
  inspirationBrands: string[];
  inspirationNotes: string;

  // AI Behavior
  creativityLevel: number;
  languagePreference: string;

  // Example outputs
  likedExamples: { type: string; content: string; date: string }[];
  dislikedExamples: { type: string; content: string; reason: string; date: string }[];
}

const EMPTY_TRAINING: AITrainingData = {
  brandVoice: '',
  brandValues: [],
  targetAudience: '',
  styleKeywords: [],
  avoidKeywords: [],
  preferredColors: [],
  avoidColors: [],
  skinToneContext: '',
  preferredFabrics: [],
  avoidFabrics: [],
  bodyContext: '',
  fitPreferences: '',
  designRules: '',
  inspirationBrands: [],
  inspirationNotes: '',
  creativityLevel: 5,
  languagePreference: 'es',
  likedExamples: [],
  dislikedExamples: [],
};

// ─── HELPERS ────────────────────────────────────────────────

async function getMaison(userId: string, db: ReturnType<typeof createServiceClient>) {
  if (!db) return null;

  // Check if super_admin
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'super_admin') {
    const { data: maisons } = await db
      .from('app_clients')
      .select('*')
      .eq('app_id', 'cereus')
      .eq('activo', true)
      .order('created_at');
    return maisons?.[0] ?? null;
  }

  // Regular user
  const { data: assignments } = await db
    .from('app_client_users')
    .select('rol, client:app_clients(*)')
    .eq('user_id', userId)
    .eq('activo', true);

  const match = assignments?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.client?.app_id === 'cereus',
  );

  return match?.client ?? null;
}

// ─── GET /api/cereus/ai/training ────────────────────────────

export async function GET() {
  // 1. Auth
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Service client
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  // 3. Get maison
  const maison = await getMaison(user.id, db);
  if (!maison) return NextResponse.json({ error: 'No maison found' }, { status: 404 });

  // 4. Extract ai_training from config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (maison as any).config ?? {};
  const aiTraining: AITrainingData = {
    ...EMPTY_TRAINING,
    ...(config.ai_training ?? {}),
  };

  return NextResponse.json({ ai_training: aiTraining });
}

// ─── POST /api/cereus/ai/training ───────────────────────────

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Service client
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  // 3. Get maison
  const maison = await getMaison(user.id, db);
  if (!maison) return NextResponse.json({ error: 'No maison found' }, { status: 404 });

  // 4. Parse body
  const body: AITrainingData = await request.json();

  // 5. Merge into existing config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingConfig = (maison as any).config ?? {};
  const updatedConfig = {
    ...existingConfig,
    ai_training: body,
  };

  // 6. Update app_clients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db
    .from('app_clients')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ config: updatedConfig } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq('id', (maison as any).id);

  if (error) {
    return NextResponse.json({ error: 'Failed to save training data', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ai_training: body });
}
