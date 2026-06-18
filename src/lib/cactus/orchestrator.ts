// ═══════════════════════════════════════════════════════════════════════════
// Ramona Orquestadora — tipos + acceso a datos + orquestación
// Reutiliza planFromGoal (src/lib/cactus/ramona.ts) y generateChat (src/lib/ai).
// Todo el acceso a datos es resiliente: si las tablas aún no existen (migración
// 033 sin aplicar), devuelve vacío en vez de romper.
// ═══════════════════════════════════════════════════════════════════════════
import type { RamonaPlan } from './ramona';

export type ProjectStatus = 'active' | 'paused' | 'done';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done';

export interface OrchestratorProject {
  id: string;
  name: string;
  objective: string | null;
  summary: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface OrchestratorTask {
  id: string;
  project_id: string;
  agent_slug: string;
  action: string;
  status: TaskStatus;
  progress: number;
  order_index: number;
}

export interface OrchestratorMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  plan: RamonaPlan | null;
  credits: number;
  created_at: string;
}

export interface OrchestratorDeliverable {
  id: string;
  project_id: string;
  task_id: string | null;
  agent_slug: string | null;
  title: string;
  kind: string;
  status: string;
  content: string | null;
  url: string | null;
  created_at: string;
}

export interface OrchestratorState {
  project: OrchestratorProject | null;
  tasks: OrchestratorTask[];
  messages: OrchestratorMessage[];
  deliverables: OrchestratorDeliverable[];
  stats: { projects: number; tasks: number; agents: number };
}

// `any` para el cliente Supabase: evita acoplar tipos generados y sigue el
// patrón del resto del código. Las queries nunca lanzan (devuelven {data,error}).
type DB = any;

export async function getActiveProject(db: DB, userId: string, companyId?: string | null): Promise<OrchestratorProject | null> {
  let q = db
    .from('cactus_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (companyId) q = q.eq('company_id', companyId); // scope por empresa activa (si existe)
  const { data } = await q
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function getTasks(db: DB, projectId: string): Promise<OrchestratorTask[]> {
  const { data } = await db
    .from('cactus_project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });
  return data || [];
}

export async function getMessages(db: DB, projectId: string): Promise<OrchestratorMessage[]> {
  const { data } = await db
    .from('cactus_project_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function getDeliverables(db: DB, projectId: string): Promise<OrchestratorDeliverable[]> {
  const { data } = await db
    .from('cactus_deliverables')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return data || [];
}

/** Carga el estado completo del workspace para el usuario (scopeado por empresa activa). */
export async function loadOrchestratorState(db: DB, userId: string, companyId?: string | null): Promise<OrchestratorState> {
  const project = await getActiveProject(db, userId, companyId);

  const [tasks, messages, deliverables] = project
    ? await Promise.all([getTasks(db, project.id), getMessages(db, project.id), getDeliverables(db, project.id)])
    : [[], [], []];

  // Stats reales
  let countQ = db
    .from('cactus_projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'done');
  if (companyId) countQ = countQ.eq('company_id', companyId);
  const { count: projectCount } = await countQ;

  const agents = new Set(tasks.filter((t) => t.status !== 'done').map((t) => t.agent_slug));

  return {
    project,
    tasks,
    messages,
    deliverables,
    stats: {
      projects: projectCount || (project ? 1 : 0),
      tasks: tasks.filter((t) => t.status !== 'done').length,
      agents: agents.size,
    },
  };
}

/** Progreso por estado de tarea (para barras del panel "Agentes activos"). */
export function taskProgress(t: Pick<OrchestratorTask, 'status' | 'progress'>): number {
  if (t.status === 'done') return 100;
  if (t.progress > 0) return t.progress;
  if (t.status === 'in_progress') return 45;
  if (t.status === 'review') return 80;
  return 0;
}
