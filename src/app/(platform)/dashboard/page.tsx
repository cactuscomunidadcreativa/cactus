import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass, Brain, Palette, Sparkles, Store, Plus,
  FolderKanban, Activity, HardDrive, ShieldCheck, CircleDot,
} from 'lucide-react';
import { Reveal } from '@/components/marketing/motion';
import { AGENTS, getAgent } from '@/lib/cactus/agents-catalog';
import { getActiveCompanyId } from '@/lib/cactus/companies';

export const metadata = { title: 'Inicio · Cactus' };

const QUICK = [
  { href: '/orchestrator', label: 'Nuevo proyecto', icon: Plus },
  { href: '/ecosystem', label: 'Ecosistema', icon: Compass },
  { href: '/brain', label: 'Cerebro', icon: Brain },
  { href: '/studio', label: 'Diseño', icon: Palette },
  { href: '/campaign', label: 'Campañas', icon: Sparkles },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
];

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-cactus-green/15 text-cactus-green' },
  paused: { label: 'En pausa', cls: 'bg-amber-100 text-amber-700' },
  done: { label: 'Completado', cls: 'bg-emerald-100 text-emerald-700' },
};

const FEATURED = ['ramona', 'biznaga', 'pitaya', 'nopal', 'agave', 'lente', 'tuna', 'candelabro'];

export default async function DashboardPage() {
  const supabase = await createClient();
  let firstName = '';
  let projects: any[] = [];
  let deliverableCount = 0;
  let activity: any[] = [];

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      firstName = profile?.full_name?.split(' ')[0] || '';

      // Empresa activa (multiempresa). null si aún no se despliega → comportamiento previo.
      const companyId = await getActiveCompanyId(supabase, user.id);

      let pjQ = supabase
        .from('cactus_projects').select('id, name, status, summary, updated_at')
        .eq('user_id', user.id);
      if (companyId) pjQ = pjQ.eq('company_id', companyId);
      const { data: pj } = await pjQ.order('updated_at', { ascending: false }).limit(5);
      projects = pj || [];

      let countQ = supabase
        .from('cactus_deliverables').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      if (companyId) countQ = countQ.eq('company_id', companyId);
      const { count } = await countQ;
      deliverableCount = count || 0;

      let actQ = supabase
        .from('cactus_deliverables').select('id, title, agent_slug, created_at')
        .eq('user_id', user.id);
      if (companyId) actQ = actQ.eq('company_id', companyId);
      const { data: act } = await actQ.order('created_at', { ascending: false }).limit(5);
      activity = act || [];
    }
  }

  const agents = FEATURED.map(getAgent).filter(Boolean) as NonNullable<ReturnType<typeof getAgent>>[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#0A241F] via-[#0D6E4F] to-[#0A241F] p-7 text-white md:p-9">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-emerald-200/90">¡Hola{firstName ? `, ${firstName}` : ''}! 👋</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Todo tu negocio, <span className="font-editorial italic text-emerald-300">potenciado por IA.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-emerald-50/85">
              Dile un objetivo a Ramona y tu comunidad de agentes lo ejecuta — investigación, contenido, diseño, ventas y más.
            </p>
            <Link href="/orchestrator" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0A241F] hover:bg-emerald-50">
              <Sparkles className="h-4 w-4" /> Hablar con Ramona
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-cactus-green/40">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cactus-green/10 text-cactus-green"><q.icon className="h-4 w-4" /></span>
            <span className="font-medium">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Columna principal */}
        <div className="space-y-6">
          {/* Tus agentes */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold">Tus agentes</h2>
              <Link href="/ecosystem" className="text-xs text-muted-foreground hover:text-foreground">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {agents.map((a) => (
                <Link key={a.slug} href={a.slug === 'ramona' ? '/orchestrator' : `/agent/${a.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-1 card-glow"
                  style={{ ['--tw-shadow-color' as string]: a.color + '40' }}>
                  <Image src={a.image} alt={a.name} width={52} height={52} className="rounded-xl motion-safe:group-hover:animate-cactus-wiggle" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="truncate text-[11px]" style={{ color: a.color }}>{a.role}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Proyectos recientes */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold">Proyectos recientes</h2>
              <Link href="/orchestrator" className="text-xs text-muted-foreground hover:text-foreground">Ir a Ramona →</Link>
            </div>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-10 text-center text-muted-foreground">
                <FolderKanban className="h-7 w-7 opacity-50" />
                <p className="text-sm">Aún no tienes proyectos. Dile un objetivo a Ramona para empezar.</p>
                <Link href="/orchestrator" className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cactus-green px-3 py-1.5 text-xs font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" /> Crear proyecto
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {projects.map((p) => {
                  const st = PROJECT_STATUS[p.status] || PROJECT_STATUS.active;
                  return (
                    <li key={p.id}>
                      <Link href="/orchestrator" className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-cactus-green/40">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cactus-green/10 text-cactus-green"><FolderKanban className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          {p.summary && <p className="truncate text-xs text-muted-foreground">{p.summary}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          {/* Estado del sistema */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 font-display font-semibold">Estado del sistema</h3>
            <ul className="space-y-2 text-sm">
              <SystemRow ok label="Ramona y agentes" value="Operativos" />
              <SystemRow ok label="Motor de IA" value="En línea" />
              <SystemRow ok label={`${AGENTS.length} agentes`} value="Disponibles" />
            </ul>
          </section>

          {/* Almacenamiento */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold"><HardDrive className="h-4 w-4 text-muted-foreground" /> Entregables</h3>
            <div className="font-display text-3xl font-bold">{deliverableCount}</div>
            <p className="text-xs text-muted-foreground">generados por tus agentes</p>
          </section>

          {/* Actividad reciente */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold"><Activity className="h-4 w-4 text-muted-foreground" /> Actividad reciente</h3>
            {activity.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Sin actividad todavía.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map((d) => {
                  const a = getAgent(d.agent_slug || '');
                  return (
                    <li key={d.id} className="flex items-start gap-2.5">
                      {a ? <Image src={a.image} alt={a.name} width={26} height={26} className="rounded-md" /> : <CircleDot className="h-5 w-5 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{d.title}</p>
                        <p className="text-[10px] text-muted-foreground">{a?.name || 'Agente'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SystemRow({ ok, label, value }: { ok?: boolean; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2">
      <ShieldCheck className={`h-4 w-4 ${ok ? 'text-emerald-500' : 'text-muted-foreground'}`} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-emerald-600">{value}</span>
    </li>
  );
}
