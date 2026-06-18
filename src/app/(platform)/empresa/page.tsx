import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { EmpresaConsole } from '@/components/cactus/empresa-console';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { Building2, LayoutGrid, Share2, Plug } from 'lucide-react';

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
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Empresa{companyName ? ` · ${companyName}` : ''}</h1>
          <p className="text-sm text-muted-foreground">Agentes, consumo, alertas y conexiones de tu empresa activa.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link href="/empresa/conexiones" className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:border-cactus-green/40">
            <Plug className="h-4 w-4" /> Conexiones
          </Link>
          <Link href="/empresa/grafo" className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:border-cactus-green/40">
            <Share2 className="h-4 w-4" /> Mapa de agentes
          </Link>
          <Link href="/empresa/centro" className="inline-flex items-center gap-2 rounded-xl bg-cactus-green px-3.5 py-2 text-sm font-medium text-white hover:bg-cactus-green/90">
            <LayoutGrid className="h-4 w-4" /> Centro de Operaciones
          </Link>
        </div>
      </header>
      <EmpresaConsole />
    </div>
  );
}
