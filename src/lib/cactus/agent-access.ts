// ═══════════════════════════════════════════════════════════════════════════
// Acceso a agentes por empresa (Fase A · Acción 3)
// Resolución: plan.included_agents ('*' = todos) + agent_configs.is_active
// + agent_activations (permanente / one-shot) − user_ai_controls (apagado personal).
// Resiliente: si las tablas no están desplegadas, degrada (todo disponible).
// ═══════════════════════════════════════════════════════════════════════════
import { AGENTS } from './agents-catalog';

type DB = any;

export interface CompanyPlan {
  slug: string;
  name: string;
  tokens_monthly: number;
  max_users: number;
  included_agents: string[];
}

export interface AgentState {
  slug: string;
  inPlan: boolean;        // incluido por el plan (o '*')
  activated: boolean;     // activación permanente extra
  available: boolean;     // inPlan || activated
  isActive: boolean;      // available && encendido (config + control de usuario)
}

const FALLBACK_PLAN: CompanyPlan = {
  slug: 'free', name: 'Free', tokens_monthly: 50000, max_users: 1,
  included_agents: ['ramona', 'cactus-ia'],
};

/** Plan de la empresa (companies.plan_id → plans). Cae a 'free' si falta. */
export async function getCompanyPlan(db: DB, companyId: string | null): Promise<CompanyPlan> {
  if (!db || !companyId) return FALLBACK_PLAN;
  try {
    const { data: c } = await db.from('companies').select('plan_id').eq('id', companyId).maybeSingle();
    const cols = 'slug, name, tokens_monthly, max_users, included_agents';
    if (c?.plan_id) {
      const { data: p } = await db.from('plans').select(cols).eq('id', c.plan_id).maybeSingle();
      if (p) return p as CompanyPlan;
    }
    const { data: free } = await db.from('plans').select(cols).eq('slug', 'free').maybeSingle();
    return (free as CompanyPlan) || FALLBACK_PLAN;
  } catch {
    return FALLBACK_PLAN;
  }
}

function planIncludes(plan: CompanyPlan, slug: string): boolean {
  const inc = plan.included_agents || [];
  return inc.includes('*') || inc.includes(slug);
}

/** Estado on/off de TODOS los agentes del catálogo para una empresa (panel). */
export async function listAgentStates(db: DB, companyId: string | null, userId: string | null): Promise<AgentState[]> {
  const plan = await getCompanyPlan(db, companyId);
  let configs: Record<string, boolean> = {};
  let activations = new Set<string>();
  let userOff = new Set<string>();
  if (db && companyId) {
    try {
      const { data } = await db.from('agent_configs').select('slug, is_active').eq('company_id', companyId);
      for (const r of (data || [])) configs[r.slug] = r.is_active;
    } catch { /* tabla ausente → sin overrides */ }
    try {
      const { data } = await db.from('agent_activations').select('agent_slug').eq('company_id', companyId).eq('status', 'active');
      for (const r of (data || [])) activations.add(r.agent_slug);
    } catch { /* noop */ }
  }
  if (db && userId) {
    try {
      const { data } = await db.from('user_ai_controls').select('feature, enabled').eq('user_id', userId).eq('enabled', false);
      for (const r of (data || [])) userOff.add(r.feature);
    } catch { /* noop */ }
  }
  return AGENTS.map((a) => {
    const inPlan = planIncludes(plan, a.slug);
    const activated = activations.has(a.slug);
    const available = inPlan || activated;
    const cfg = configs[a.slug];
    const isActive = available && cfg !== false && !userOff.has(a.slug);
    return { slug: a.slug, inPlan, activated, available, isActive };
  });
}

/** ¿El agente está DISPONIBLE para la empresa? (en plan o activado). Para el gate. */
export async function isAgentAvailable(db: DB, companyId: string | null, slug: string): Promise<boolean> {
  if (!db || !companyId) return true; // pre-deploy → no bloquear
  const plan = await getCompanyPlan(db, companyId);
  if (planIncludes(plan, slug)) return true;
  try {
    const { data } = await db.from('agent_activations')
      .select('id').eq('company_id', companyId).eq('agent_slug', slug).eq('status', 'active').limit(1);
    return !!(data && data.length);
  } catch {
    return true; // tabla ausente → no bloquear
  }
}

/** Enciende/apaga un agente para la empresa (upsert en agent_configs). */
export async function setAgentActive(db: DB, companyId: string, slug: string, isActive: boolean): Promise<boolean> {
  if (!db || !companyId || !slug) return false;
  try {
    const { error } = await db.from('agent_configs')
      .upsert({ company_id: companyId, slug, is_active: isActive }, { onConflict: 'company_id,slug' });
    return !error;
  } catch {
    return false;
  }
}

export interface AgentConfigOverride {
  provider?: string | null;
  model?: string | null;
  display_name?: string | null;
  description?: string | null;
  image_url?: string | null;
  prompt?: string | null;
  custom_instructions?: string | null;
  culture_prompt?: string | null;
  company_tone?: string | null;
  company_values?: string | null;
  industry_context?: string | null;
  is_active?: boolean;
}

/** Configuración por empresa de un agente (persona/modelo/foto…). null si no hay. */
export async function getAgentConfig(db: DB, companyId: string | null, slug: string): Promise<AgentConfigOverride | null> {
  if (!db || !companyId || !slug) return null;
  try {
    const { data } = await db.from('agent_configs').select('*').eq('company_id', companyId).eq('slug', slug).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

/** Guarda la configuración por empresa de un agente (upsert). */
export async function saveAgentConfig(db: DB, companyId: string, slug: string, fields: AgentConfigOverride): Promise<boolean> {
  if (!db || !companyId || !slug) return false;
  try {
    const clean: any = { company_id: companyId, slug };
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) clean[k] = v;
    const { error } = await db.from('agent_configs').upsert(clean, { onConflict: 'company_id,slug' });
    return !error;
  } catch {
    return false;
  }
}

/** Activa un agente: permanente (lo suma al plan) o one-shot (solo esta tarea). */
export async function activateAgent(
  db: DB,
  opts: { companyId: string; userId: string; slug: string; mode: 'permanent' | 'one_shot'; taskId?: string | null; credits?: number },
): Promise<boolean> {
  if (!db || !opts.companyId || !opts.slug) return false;
  try {
    const row: any = {
      company_id: opts.companyId, user_id: opts.userId, agent_slug: opts.slug,
      mode: opts.mode, status: 'active', credits: opts.credits ?? 0,
    };
    if (opts.taskId) row.task_id = opts.taskId;
    const { error } = await db.from('agent_activations').insert(row);
    return !error;
  } catch {
    return false;
  }
}
