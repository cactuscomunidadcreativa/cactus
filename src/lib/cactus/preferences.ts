// ═══════════════════════════════════════════════════════════════════════════
// Aprendizaje (Fase E) — feedback → preferencias (empresa/agente/usuario) → contexto.
// El contextualizador inyecta estas preferencias para que el equipo mejore con el uso.
// Resiliente: nunca lanza.
// ═══════════════════════════════════════════════════════════════════════════
type DB = any;

/** Texto de preferencias aplicables a un agente (empresa + agente + usuario). */
export async function getLearnedContext(db: DB, opts: { companyId: string | null; agentSlug: string; userId?: string | null }): Promise<string> {
  if (!db || !opts.companyId) return '';
  const lines: string[] = [];
  try {
    const { data } = await db.from('business_preferences')
      .select('scope, agent_slug, content')
      .eq('company_id', opts.companyId)
      .order('weight', { ascending: false }).limit(30);
    for (const p of (data || [])) {
      if (p.scope === 'company' || (p.scope === 'agent' && p.agent_slug === opts.agentSlug)) lines.push(`- ${p.content}`);
    }
  } catch { /* tabla ausente */ }
  // NO se inyecta user_preferences: esa tabla es por user_id (sin company_id) y nada la
  // escribe en el código, así que solo podía filtrar datos entre empresas (la misma clase
  // de fuga que metía ROWI en otra empresa). El aprendizaje por empresa vive en
  // business_preferences (arriba), que sí está scopeado por company_id.
  return lines.slice(0, 12).join('\n').slice(0, 1500);
}

export async function recordFeedback(db: DB, fb: { companyId: string | null; userId: string | null; deliverableId?: string | null; agentSlug?: string | null; rating: number; comment?: string | null }): Promise<void> {
  if (!db) return;
  try {
    await db.from('agent_feedback').insert({
      company_id: fb.companyId || null, user_id: fb.userId || null,
      deliverable_id: fb.deliverableId || null, agent_slug: fb.agentSlug || null,
      rating: fb.rating || 0, comment: fb.comment || null,
    });
  } catch { /* noop */ }
}

/** Convierte un comentario de feedback en una preferencia aprendida del agente. */
export async function learnFromFeedback(db: DB, opts: { companyId: string | null; agentSlug?: string | null; comment?: string | null; rating: number }): Promise<void> {
  const comment = (opts.comment || '').trim();
  if (!db || !opts.companyId || !comment) return;
  const prefix = opts.rating < 0 ? 'Evita / corrige' : 'Prefiere';
  try {
    await db.from('business_preferences').insert({
      company_id: opts.companyId,
      scope: opts.agentSlug ? 'agent' : 'company',
      agent_slug: opts.agentSlug || null,
      content: `${prefix}: ${comment.slice(0, 300)}`,
      source: 'feedback',
    });
  } catch { /* noop */ }
}
