// ═══════════════════════════════════════════════════════════════════════════
// Auditoría model_usage (Fase C) — traza granular por ejecución:
// quién · agente · proveedor/modelo · tokens · costo · contexto (proyecto/tarea/entregable).
// Best-effort: nunca lanza.
// ═══════════════════════════════════════════════════════════════════════════
type DB = any;

export interface ModelUsageRow {
  companyId?: string | null;
  userId?: string | null;
  agentSlug?: string | null;
  provider?: string | null;
  model?: string | null;
  kind?: 'agent_run' | 'subagent' | 'chat' | 'observer';
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  credits?: number;
  projectId?: string | null;
  taskId?: string | null;
  deliverableId?: string | null;
  meta?: Record<string, unknown>;
}

export async function recordModelUsage(db: DB, u: ModelUsageRow): Promise<void> {
  if (!db) return;
  try {
    await db.from('model_usage').insert({
      company_id: u.companyId || null,
      user_id: u.userId || null,
      agent_slug: u.agentSlug || null,
      provider: u.provider || null,
      model: u.model || null,
      kind: u.kind || 'agent_run',
      tokens_in: Math.round(u.tokensIn || 0),
      tokens_out: Math.round(u.tokensOut || 0),
      cost_usd: u.costUsd || 0,
      credits: Math.round(u.credits || 0),
      project_id: u.projectId || null,
      task_id: u.taskId || null,
      deliverable_id: u.deliverableId || null,
      meta: u.meta || {},
    });
  } catch {
    /* tabla ausente / error → ignorar (no debe tumbar la ejecución) */
  }
}
