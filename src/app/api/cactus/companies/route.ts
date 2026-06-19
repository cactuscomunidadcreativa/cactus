import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listUserCompanies, getActiveCompanyId } from '@/lib/cactus/companies';

export const dynamic = 'force-dynamic';

// Lista de empresas del usuario + empresa activa (para mostrar "estás en X").
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ companies: [], activeId: null });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ companies: [], activeId: null });

  const [companies, activeId] = await Promise.all([
    listUserCompanies(supabase, user.id),
    getActiveCompanyId(supabase, user.id),
  ]);
  return NextResponse.json({ companies, activeId });
}
