import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

interface AdminAuthResult {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Emails that are always treated as super-admin, regardless of the DB role.
 * Belt-and-suspenders so the founder never gets locked out of his own platform.
 * Configure with SUPER_ADMIN_EMAILS="a@x.com,b@y.com".
 */
const ENV_SUPER_ADMINS = (process.env.SUPER_ADMIN_EMAILS || 'eduardo@cactuscomunidadcreativa.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** True if the user is a super-admin by DB role OR by the ENV allowlist. */
export function isSuperAdmin(email?: string | null, role?: string | null): boolean {
  if (role === 'super_admin') return true;
  if (email && ENV_SUPER_ADMINS.includes(email.toLowerCase())) return true;
  return false;
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

  if (!isSuperAdmin(user.email, profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { supabase, user };
}
