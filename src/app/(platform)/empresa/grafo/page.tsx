import Link from 'next/link';
import { ArrowLeft, Share2, LayoutGrid } from 'lucide-react';
import { AgentGraphMap } from '@/components/cactus/agent-graph-map';

export const metadata = { title: 'Mapa de agentes · Cactus' };

export default function AgentGraphPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresa
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green">
          <Share2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Mapa de agentes</h1>
          <p className="text-sm text-muted-foreground">El grafo del equipo: quién está encendido y quién colabora con quién.</p>
        </div>
        <Link href="/empresa/centro" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:border-cactus-green/40">
          <LayoutGrid className="h-4 w-4" /> Centro de Operaciones
        </Link>
      </header>
      <AgentGraphMap />
    </div>
  );
}
