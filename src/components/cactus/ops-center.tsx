'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, KeyRound, Sparkles, Pencil } from 'lucide-react';

export function OpsCenter() {
  const [agents, setAgents] = useState<any[] | null>(null);
  useEffect(() => { fetch('/api/cactus/agents/overview').then((r) => r.json()).then((d) => setAgents(d.agents || [])); }, []);

  if (!agents) return <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {agents.map((a) => (
        <Link key={a.slug} href={`/empresa/agentes/${a.slug}`}
          className="group rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-cactus-green/40">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white">
            {a.video
              ? <video src={a.video} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-contain" />
              /* eslint-disable-next-line @next/next/no-img-element */
              : <img src={a.image} alt={a.name} className="h-full w-full object-contain" />}
            <span className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${a.isActive ? 'bg-cactus-green' : 'bg-muted-foreground/40'}`} title={a.isActive ? 'Encendido' : 'Apagado'} />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-3 w-3" /> Editar
            </span>
          </div>
          <div className="mt-2">
            <p className="truncate text-sm font-semibold">{a.name}</p>
            <p className="truncate text-[11px]" style={{ color: a.color }}>{a.role}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge>{a.provider || 'modelo def.'}</Badge>
              {a.hasPrompt && <Badge icon={<Sparkles className="h-3 w-3" />}>persona</Badge>}
              {a.secrets > 0 && <Badge icon={<KeyRound className="h-3 w-3" />}>{a.secrets}</Badge>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {icon}{children}
    </span>
  );
}
