import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Share2 } from 'lucide-react';
import { OpsCenter } from '@/components/cactus/ops-center';

export const metadata = { title: 'Centro de Operaciones · Cactus' };

export default function OpsCenterPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Empresa</Link>
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green"><LayoutGrid className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Centro de Operaciones</h1>
          <p className="text-sm text-muted-foreground">Todos tus agentes y lo que tiene cada uno hoy. Toca una tarjeta para editar foto, modelo, persona y credenciales.</p>
        </div>
        <Link href="/empresa/grafo" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:border-cactus-green/40">
          <Share2 className="h-4 w-4" /> Mapa de agentes
        </Link>
      </header>
      <OpsCenter />
    </div>
  );
}
