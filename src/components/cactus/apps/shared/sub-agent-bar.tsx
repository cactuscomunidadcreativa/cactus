'use client';

// Selector de mini-agente (Bloque 6). El valor activo se envía como `subAgent`
// en el body del fetch a /api/cactus/agent, reorientando al agente.

import { Bot } from 'lucide-react';
import { getSubAgents } from '@/lib/cactus/sub-agents';

export function SubAgentBar({
  slug, value, onChange, accent,
}: {
  slug: string; value: string | null; onChange: (key: string | null) => void; accent: string;
}) {
  const subs = getSubAgents(slug);
  if (!subs.length) return null;
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Bot className="h-3.5 w-3.5" /> Mini-agente
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip label="Equipo completo" active={!value} accent={accent} onClick={() => onChange(null)} />
        {subs.map((s) => (
          <Chip key={s.key} label={s.name} title={s.role} active={value === s.key} accent={accent} onClick={() => onChange(s.key)} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, title, active, accent, onClick }: { label: string; title?: string; active: boolean; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-full border px-2.5 py-1 text-xs transition-colors"
      style={active ? { backgroundColor: accent, color: '#fff', borderColor: accent } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
    >
      {label}
    </button>
  );
}
