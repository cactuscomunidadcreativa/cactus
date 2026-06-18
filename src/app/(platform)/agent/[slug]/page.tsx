import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { AgentConsole } from '@/components/cactus/agent-console';
import { getAgent, AGENTS_WITH_CARD } from '@/lib/cactus/agents-catalog';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getEffectiveAgentImages } from '@/lib/cactus/agent-images';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getAgent(params.slug);
  return { title: a ? `${a.name} · Cactus` : 'Agente · Cactus' };
}

export default async function AgentPage({ params }: { params: { slug: string } }) {
  const agent = getAgent(params.slug);
  if (!agent) notFound();
  const hasCard = AGENTS_WITH_CARD.has(agent.slug);

  // Foto efectiva (empresa sobre global) del editor
  let override: string | undefined;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const companyId = user ? await getActiveCompanyId(supabase, user.id) : null;
    const images = await getEffectiveAgentImages(supabase, companyId);
    override = images[agent.slug];
  }
  const cardSrc = override || `/agents/${agent.slug}-card.png`;
  const showCard = !!override || hasCard;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/ecosystem" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Ecosistema
      </Link>

      <div className={showCard ? 'grid gap-6 lg:grid-cols-[300px_1fr]' : 'mx-auto max-w-3xl'}>
        {showCard && (
          <aside className="hidden lg:block">
            <div className="group sticky top-4 overflow-hidden rounded-2xl border border-border shadow-sm">
              <Image
                src={cardSrc}
                alt={agent.name}
                width={530}
                height={760}
                className="w-full object-contain motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle"
              />
            </div>
          </aside>
        )}
        <AgentConsole
          agent={{
            slug: agent.slug, name: agent.name, role: agent.role, emoji: agent.emoji,
            color: agent.color, image: override || agent.image, tools: agent.tools, description: agent.description,
          }}
        />
      </div>
    </div>
  );
}
