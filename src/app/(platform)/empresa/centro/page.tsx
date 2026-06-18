import Link from 'next/link';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { OpsCenter } from '@/components/cactus/ops-center';

export const metadata = { title: 'Centro de Operaciones · Cactus' };

export default function OpsCenterPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Empresa</Link>
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green"><LayoutGrid className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-2xl font-bold">Centro de Operaciones</h1>
          <p className="text-sm text-muted-foreground">Todos tus agentes y lo que tiene cada uno hoy. Toca una tarjeta para editar foto, modelo, persona y credenciales.</p>
        </div>
      </header>
      <OpsCenter />
    </div>
  );
}
