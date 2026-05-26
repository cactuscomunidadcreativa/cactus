import { createClient } from '@/lib/supabase/server';
import { AreaDashboard } from '@/modules/eq-latam/components/area-dashboard';
import { USERS } from '@/modules/eq-latam';

/**
 * Auth-gated EQ Latam dashboard.
 * Maps the Supabase-authenticated user to the internal eq-latam user_id
 * via email lookup against the seeded USERS array. Falls back to 'eduardo'
 * (admin) if no match is found — useful for dev when Supabase email
 * doesn't yet correspond to a seeded team member.
 */
export default async function EqLatamPage() {
  const supabase = await createClient();
  let initialUserId = 'eduardo';

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const match = USERS.find(
        u => u.email.toLowerCase() === user.email!.toLowerCase(),
      );
      if (match) initialUserId = match.id;
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <AreaDashboard initialUserId={initialUserId} />
    </div>
  );
}
