import { DesignStudio } from '@/components/cactus/design-studio';
import { PageHeader } from '@/components/cactus/page-header';

export const metadata = { title: 'Estudio visual · Cactus' };

const AGENTS: Record<string, { name: string; emoji: string; mode: 'design' | 'photo' | 'character'; tagline: string; title: string; sub: string }> = {
  lente: { name: 'Lente · Foto', emoji: '📷', mode: 'photo', tagline: 'Describe la toma, yo la dirijo.', title: '📷 Lente · Estudio Fotográfico', sub: 'Sesiones de producto, editorial y e-commerce generadas con IA.' },
  astrophytum: { name: 'Astrophytum · Personaje', emoji: '⭐', mode: 'character', tagline: 'Describe el personaje, yo lo diseño.', title: '⭐ Astrophytum · Diseño de Personaje', sub: 'Mascotas, personajes y avatares estilizados para tu marca.' },
};

export default function StudioPage({ searchParams }: { searchParams?: { agent?: string } }) {
  const cfg = AGENTS[searchParams?.agent || ''] || {
    name: 'Cardón · Diseño', emoji: '🎨', mode: 'design' as const, tagline: 'Describe la pieza, yo la diseño.',
    title: '🎨 Cardón · Estudio de Diseño', sub: 'Describe la pieza y Cardón la genera. Primer agente del Omni Creator que produce de verdad.',
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader emoji={cfg.emoji} title={cfg.title.replace(/^[^\s]+\s/, '')} subtitle={cfg.sub} />
      <DesignStudio agentName={cfg.name} emoji={cfg.emoji} mode={cfg.mode} tagline={cfg.tagline} />
    </div>
  );
}
