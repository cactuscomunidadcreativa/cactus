import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service_role key.
 * This bypasses RLS — use only in API routes after verifying user auth.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
