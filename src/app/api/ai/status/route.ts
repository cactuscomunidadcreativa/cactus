import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIStatus } from '@/lib/ai';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = await getAIStatus();
  return NextResponse.json(status);
}
