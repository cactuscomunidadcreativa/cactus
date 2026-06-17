import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ArrowRight } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion';

const APP_LOGOS: Record<string, string> = {
  ramona: '/ramona.png', tuna: '/tuna.png', agave: '/agave.png',
  saguaro: '/saguaro.png', pita: '/pita.png', cereus: '/cereus.png',
};

const QUICK_ACCESS = [
  { href: '/ecosystem', emoji: '🌵', title: 'Ecosistema', desc: 'Tus 27 agentes' },
  { href: '/orchestrator', emoji: '🧭', title: 'Ramona', desc: 'Dile un objetivo' },
  { href: '/campaign', emoji: '💡', title: 'Campañas', desc: 'Click emocional' },
  { href: '/brain', emoji: '🧠', title: 'Cerebro', desc: 'Tu marca' },
  { href: '/studio', emoji: '🎨', title: 'Diseño', desc: 'Genera piezas' },
  { href: '/voice', emoji: '🎙️', title: 'Voz', desc: 'Locución IA' },
];

export const metadata = { title: 'Inicio · Cactus' };

export default async function DashboardPage() {
  const supabase = await createClient();
  let profileName: string | null = null;
  let activeSubs: any[] = [];

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      profileName = profile?.full_name || null;
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('app_id, status, apps (name, icon, color, description)')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing']);
      activeSubs = subscriptions || [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Bienvenida */}
      <Reveal className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hola{profileName ? `, ${profileName.split(' ')[0]}` : ''} 🌵
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tu comunidad creativa de IA, <em className="font-editorial">lista para trabajar.</em>
        </p>
      </Reveal>

      {/* Accesos rápidos */}
      <div className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Empezar</h2>
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACCESS.map((q) => (
            <StaggerItem key={q.href}>
              <Link
                href={q.href}
                className="group flex h-full flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-cactus-green/40 card-glow"
                style={{ ['--tw-shadow-color' as string]: 'rgba(62,142,64,0.25)' }}
              >
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{q.emoji}</span>
                <span className="text-sm font-medium leading-tight">{q.title}</span>
                <span className="text-[11px] text-muted-foreground">{q.desc}</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Mis apps */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Mis apps</h2>
        {activeSubs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium">Aún no activas ninguna app</h3>
            <p className="mb-4 text-sm text-muted-foreground">Explora el marketplace o el ecosistema de agentes.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-md bg-cactus-green px-4 py-2 text-sm font-medium text-white hover:bg-cactus-green/90">
              Ir al marketplace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSubs.map((sub: any) => (
              <Link
                key={sub.app_id}
                href={`/apps/${sub.app_id}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-cactus-green/50"
              >
                <div className="flex items-start gap-3">
                  {APP_LOGOS[sub.app_id] ? (
                    <Image src={APP_LOGOS[sub.app_id]} alt={sub.apps?.name || sub.app_id} width={40} height={40} className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: (sub.apps?.color || '#888') + '15' }}>
                      {sub.apps?.icon || '📦'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium transition-colors group-hover:text-cactus-green">{sub.apps?.name || sub.app_id}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{sub.apps?.description || ''}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-colors group-hover:text-cactus-green" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
