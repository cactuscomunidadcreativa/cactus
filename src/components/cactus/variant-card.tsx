import type { AngleVariant } from '@/lib/eq/generate';

const AXIS_LABEL: Record<string, string> = {
  racional: 'Racional', emocional: 'Emocional',
  motivar: 'Motivar', sostener: 'Sostener',
  corto: 'Corto plazo', largo: 'Largo plazo',
};

export function VariantCard({ v }: { v: AngleVariant }) {
  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card p-4"
      style={{ borderTopWidth: 3, borderTopColor: v.color }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{v.emoji}</span>
        <span className="font-display font-semibold" style={{ color: v.color }}>{v.profileName}</span>
        <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: v.color + '15', color: v.color }}>
          {v.emotion}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {[v.procesamiento, v.cambio, v.horizonte].map((a, i) => (
          <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {AXIS_LABEL[a] || a}
          </span>
        ))}
      </div>

      <h4 className="font-display font-semibold leading-snug">{v.headline}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>

      <div className="mt-3 inline-flex w-fit rounded-md px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: v.color }}>
        {v.cta}
      </div>

      <p className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
        💡 {v.rationale}
      </p>
    </div>
  );
}
