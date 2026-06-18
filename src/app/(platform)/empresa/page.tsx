import { createClient } from '@/lib/supabase/server';
import { EmpresaConsole } from '@/components/cactus/empresa-console';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { Building2 } from 'lucide-react';

export const metadata = { title: 'Empresa · Cactus' };

export default async function EmpresaPage() {
  const supabase = await createClient();
  let companyName = '';
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const companyId = await getActiveCompanyId(supabase, user.id);
      if (companyId) {
        const { data: c } = await supabase.from('companies').select('name').eq('id', companyId).maybeSingle();
        companyName = c?.name || '';
      }
    }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Empresa{companyName ? ` · ${companyName}` : ''}</h1>
          <p className="text-sm text-muted-foreground">Agentes, consumo, alertas y conexiones de tu empresa activa.</p>
        </div>
      </header>
      <EmpresaConsole />
    </div>
  );
}
