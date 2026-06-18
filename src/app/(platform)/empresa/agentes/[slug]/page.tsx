import { notFound } from 'next/navigation';
import { AgentEditor } from '@/components/cactus/agent-editor';
import { getAgent } from '@/lib/cactus/agents-catalog';

export const metadata = { title: 'Editar agente · Cactus' };

export default function AgentEditorPage({ params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) notFound();
  return <div className="py-2"><AgentEditor slug={params.slug} /></div>;
}
