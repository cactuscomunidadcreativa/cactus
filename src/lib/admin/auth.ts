import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

interface AdminAuthResult {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Verifies the current request is from an authenticated super_admin user.
 * Returns the Supabase client and user, or throws a NextResponse error.
 *
 * Usage in API routes:
 * ```ts
 * const result = await requireAdmin();
 * if (result instanceof NextResponse) return result;
 * const { supabase, user } = result;
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult | NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { supabase, user };
}
