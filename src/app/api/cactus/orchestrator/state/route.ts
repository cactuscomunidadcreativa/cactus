import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadOrchestratorState, type OrchestratorState } from '@/lib/cactus/orchestrator';
import { getActiveCompanyId } from '@/lib/cactus/companies';

export const maxDuration = 30;

const EMPTY: OrchestratorState = {
  project: null, tasks: [], messages: [], deliverables: [],
  stats: { projects: 0, tasks: 0, agents: 0 },
};

export async function GET() {
  const supabase = await createClient();
  // Dev sin Supabase: estado vacío (la UI muestra el estado inicial)
  if (!supabase) return NextResponse.json({ state: EMPTY });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Multiempresa: scope por empresa activa (null = comportamiento previo / sin desplegar).
  const companyId = await getActiveCompanyId(supabase, user.id);
  const state = await loadOrchestratorState(supabase, user.id, companyId);
  return NextResponse.json({ state });
}
