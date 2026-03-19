import { createServiceClient } from '@/lib/supabase/service';
import type { MaisonConfig } from '@/modules/cereus/types';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';

export default async function MaisonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ maisonId?: string }>;
}) {
  // Extract maisonId from the first dynamic segment
  // The actual maisonId comes from the nested route params
  return (
    <div className="min-h-screen bg-[var(--maison-bg,#ffffff)]">
      {children}
    </div>
  );
}
