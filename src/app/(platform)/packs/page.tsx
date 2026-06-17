import Image from 'next/image';
import { Check } from 'lucide-react';
import { PACKS } from '@/lib/cactus/packs';
import { getAgent, AGENTS } from '@/lib/cactus/agents-catalog';

export const metadata = { title: 'Packs · Cactus Comunidad Creativa' };

function fmtCredits(c: number) {
  return c === -1 ? 'Ilimitado · BYOK' : `${c.toLocaleString()} créditos/mes`;
}

export default function PacksPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Packs</h1>
        <p className="text-sm text-muted-foreground">
          Contrata por pack o agente individual. Cada pack trae sus cactus y un cupo de créditos al mes.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PACKS.map((pack) => {
          const agents = pack.key === 'full' ? AGENTS.slice(0, 12) : pack.agents.map(getAgent).filter(Boolean);
          return (
            <div
              key={pack.key}
              className={`flex flex-col rounded-xl border bg-card p-5 ${pack.featured ? 'border-cactus-green ring-1 ring-cactus-green/30' : 'border-border'}`}
            >
              {pack.featured && (
                <span className="mb-2 w-fit rounded-full bg-cactus-green/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cactus-green">
                  Más popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold">{pack.name}</h3>
              <p className="text-sm text-muted-foreground">{pack.tagline}</p>
              <p className="mt-2 text-sm font-medium text-cactus-green">{fmtCredits(pack.credits)}</p>

              <div className="mt-4 flex-1 space-y-1.5">
                {pack.key === 'full' ? (
                  <div className="flex items-center gap-2 text-sm"><Check className="h-3.5 w-3.5 text-cactus-green" /> Los {AGENTS.length} agentes + integraciones</div>
                ) : (
                  agents.map((a: any) => (
                    <div key={a.slug} className="flex items-center gap-2 text-sm">
                      <Image src={a.image} alt={a.name} width={20} height={20} className="rounded" />
                      <span>{a.name}</span>
                      <span className="text-xs text-muted-foreground">· {a.role}</span>
                    </div>
                  ))
                )}
              </div>

              <a
                href={`mailto:eduardo@cactuscomunidadcreativa.com?subject=Activar%20${encodeURIComponent(pack.name)}`}
                className={`mt-5 w-full rounded-md py-2.5 text-center text-sm font-medium transition-colors ${pack.featured ? 'bg-cactus-green text-white hover:bg-cactus-green/90' : 'border border-border hover:border-cactus-green hover:text-cactus-green'}`}
              >
                Activar {pack.name.replace('Cactus ', '')}
              </a>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        El cobro automático por pack se activa al conectar los Price IDs de Stripe y el saldo de créditos (migración 031).
      </p>
    </div>
  );
}
