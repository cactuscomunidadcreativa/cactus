import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { AgentConsole } from '@/components/cactus/agent-console';
import { getAgent, AGENTS_WITH_CARD } from '@/lib/cactus/agents-catalog';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getAgent(params.slug);
  return { title: a ? `${a.name} · Cactus` : 'Agente · Cactus' };
}

export default function AgentPage({ params }: { params: { slug: string } }) {
  const agent = getAgent(params.slug);
  if (!agent) notFound();
  const hasCard = AGENTS_WITH_CARD.has(agent.slug);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/ecosystem" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Ecosistema
      </Link>

      <div className={hasCard ? 'grid gap-6 lg:grid-cols-[300px_1fr]' : 'mx-auto max-w-3xl'}>
        {hasCard && (
          <aside className="hidden lg:block">
            <div className="group sticky top-4 overflow-hidden rounded-2xl border border-border shadow-sm">
              <Image
                src={`/agents/${agent.slug}-card.png`}
                alt={agent.name}
                width={530}
                height={760}
                className="w-full motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle"
              />
            </div>
          </aside>
        )}
        <AgentConsole
          agent={{
            slug: agent.slug, name: agent.name, role: agent.role, emoji: agent.emoji,
            color: agent.color, image: agent.image, tools: agent.tools, description: agent.description,
          }}
        />
      </div>
    </div>
  );
}
