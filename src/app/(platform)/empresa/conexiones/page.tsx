import Link from 'next/link';
import { ArrowLeft, Plug } from 'lucide-react';
import { IntegrationsHub } from '@/components/cactus/integrations-hub';

export const metadata = { title: 'Conexiones · Cactus' };

export default function ConexionesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresa
      </Link>
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green">
          <Plug className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Conexiones</h1>
          <p className="text-sm text-muted-foreground">Conecta tus herramientas de negocio para que los agentes actúen: pagos, ads, email, WhatsApp y más. La IA (texto, imagen, voz, video) ya viene incluida — no necesitas llaves.</p>
        </div>
      </header>
      <IntegrationsHub />
    </div>
  );
}
