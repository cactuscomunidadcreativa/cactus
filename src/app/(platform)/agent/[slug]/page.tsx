import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AgentConsole } from '@/components/cactus/agent-console';
import { getAgent } from '@/lib/cactus/agents-catalog';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getAgent(params.slug);
  return { title: a ? `${a.name} · Cactus` : 'Agente · Cactus' };
}

export default function AgentPage({ params }: { params: { slug: string } }) {
  const agent = getAgent(params.slug);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/ecosystem" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Ecosistema
      </Link>
      <AgentConsole
        agent={{
          slug: agent.slug, name: agent.name, role: agent.role, emoji: agent.emoji,
          color: agent.color, image: agent.image, tools: agent.tools, description: agent.description,
        }}
      />
    </div>
  );
}
