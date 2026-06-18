import Image from 'next/image';
import { BookOpen, Boxes, Plug, Database, FileText, Link2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BrandKitForm } from '@/components/cactus/brand-kit-form';
import { BrainReindex } from '@/components/cactus/brain-reindex';
import { KpiRow } from '@/components/cactus/app-shell/kpi-row';
import { AGENTS } from '@/lib/cactus/agents-catalog';
import { CompaniesManager, type CompanyRow } from '@/components/cactus/companies-manager';
import { listUserCompanies, getActiveCompanyId } from '@/lib/cactus/companies';

export const metadata = { title: 'Cerebro · Cactus IA' };

const BRAIN_COLOR = '#0D6E4F';

const INTEGRATIONS = [
  { name: 'Google Drive', emoji: '📁' }, { name: 'Notion', emoji: '📝' },
  { name: 'Slack', emoji: '💬' }, { name: 'WhatsApp', emoji: '🟢' },
  { name: 'Gmail', emoji: '✉️' }, { name: 'Instagram', emoji: '📸' },
  { name: 'Webo URL', emoji: '🌐' }, { name: 'PDFs', emoji: '📄' },
];

const KIND_ICON: Record<string, typeof FileText> = { url: Link2, pdf: FileText, doc: FileText, note: FileText, faq: BookOpen };

export default async function BrainPage() {
  const supabase = await createClient();
  let brandCount = 0;
  let items: any[] = [];
  let itemCount = 0;
  let companies: CompanyRow[] = [];
  let activeCompanyId: string | null = null;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count: bc } = await supabase.from('cactus_brand_kits').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      brandCount = bc || 0;
      const { data: ki, count: ic } = await supabase
        .from('cactus_knowledge_items').select('id, title, kind, source_url, created_at', { count: 'exact' })
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6);
      items = ki || [];
      itemCount = ic || 0;

      // Multiempresa: lista de empresas + marcas por empresa + empresa activa
      activeCompanyId = await getActiveCompanyId(supabase, user.id);
      const list = await listUserCompanies(supabase, user.id);
      const byCompany = new Map<string, string[]>();
      try {
        const { data: bks } = await supabase.from('cactus_brand_kits').select('name, company_id').eq('user_id', user.id);
        for (const b of (bks || []) as any[]) {
          if (!b.company_id) continue;
          const arr = byCompany.get(b.company_id) || [];
          if (b.name) arr.push(b.name);
          byCompany.set(b.company_id, arr);
        }
      } catch { /* tabla sin company_id → sin agrupar */ }
      companies = list.map((c) => ({ ...c, brands: byCompany.get(c.id) || [], brandCount: (byCompany.get(c.id) || []).length }));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <Image src="/cactus-ia-logo.png" alt="Cerebro Cactus" width={56} height={56} className="rounded-2xl" />
        <div>
          <h1 className="font-display text-2xl font-bold">Cerebro Cactus <span className="text-sm font-normal text-muted-foreground">· Knowledge Hub</span></h1>
          <p className="text-sm text-muted-foreground">El conocimiento y la marca que alimentan a los {AGENTS.length} agentes.</p>
        </div>
      </div>

      {/* KPIs */}
      <KpiRow
        accent={BRAIN_COLOR}
        items={[
          { label: 'Marcas', value: brandCount, icon: <Boxes className="h-4 w-4" /> },
          { label: 'Conocimiento', value: itemCount, icon: <BookOpen className="h-4 w-4" /> },
          { label: 'Integraciones', value: INTEGRATIONS.length, icon: <Plug className="h-4 w-4" /> },
          { label: 'Agentes alimentados', value: AGENTS.length, icon: <Database className="h-4 w-4" /> },
        ]}
      />

      {/* Multiempresa: crear / ver / cambiar empresas y sus marcas */}
      <CompaniesManager companies={companies} activeId={activeCompanyId} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Brand Kit */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold">Brand Kit</h2>
          <BrandKitForm />
        </div>

        {/* Lateral: RAG + conocimiento + integraciones */}
        <div className="space-y-6">
          <BrainReindex />
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold">Base de conocimiento</h2>
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /> Agregar</button>
            </div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <BookOpen className="h-6 w-6 opacity-50" />
                <p className="text-xs">Sube documentos, URLs o notas para que los agentes aprendan de tu negocio.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => {
                  const Icon = KIND_ICON[it.kind] || FileText;
                  return (
                    <li key={it.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cactus-green/10 text-cactus-green"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{it.title}</span>
                        <span className="block truncate text-[11px] uppercase text-muted-foreground">{it.kind}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 font-display font-semibold">Integraciones</h2>
            <div className="grid grid-cols-2 gap-2">
              {INTEGRATIONS.map((i) => (
                <button key={i.name} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-sm transition-colors hover:border-cactus-green/40">
                  <span className="text-base">{i.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{i.name}</span>
                  <span className="text-[10px] text-muted-foreground">Conectar</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
