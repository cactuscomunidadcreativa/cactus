// ═══════════════════════════════════════════════════════════════════════════
// Bus de alertas + escalación a Ramona (Fase A · Acción 5)
// Los agentes/observadores levantan alertas; Ramona es la central que decide.
// Resiliente: si la tabla no existe, no rompe (devuelve false / []).
// ═══════════════════════════════════════════════════════════════════════════
type DB = any;

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'open' | 'ack' | 'resolved' | 'dismissed';

export interface RaiseAlertInput {
  companyId: string;
  origin: string;           // slug del agente/observador
  type: string;             // market | reputation | opportunity | quota | care | news ...
  title: string;
  body?: string;
  severity?: AlertSeverity;
  dedupKey?: string;        // evita duplicar el mismo hallazgo
  payload?: Record<string, unknown>;
}

/** Levanta una alerta. Devuelve true si se creó (false si dup o error). */
export async function raiseAlert(db: DB, a: RaiseAlertInput): Promise<boolean> {
  if (!db || !a.companyId || !a.title) return false;
  try {
    // Dedup: si ya hay una alerta viva con la misma clave, no dupliques
    if (a.dedupKey) {
      const { data: existing } = await db
        .from('alerts').select('id')
        .eq('company_id', a.companyId).eq('dedup_key', a.dedupKey)
        .in('status', ['open', 'ack']).limit(1);
      if (existing && existing.length) return false;
    }
    const { error } = await db.from('alerts').insert({
      company_id: a.companyId,
      origin: a.origin,
      type: a.type,
      severity: a.severity || 'info',
      title: a.title,
      body: a.body || null,
      dedup_key: a.dedupKey || null,
      payload: a.payload || {},
    });
    return !error;
  } catch {
    return false;
  }
}

export async function listAlerts(db: DB, companyId: string | null, status?: AlertStatus): Promise<any[]> {
  if (!db || !companyId) return [];
  try {
    let q = db.from('alerts').select('*').eq('company_id', companyId);
    if (status) q = q.eq('status', status);
    const { data } = await q.order('created_at', { ascending: false }).limit(50);
    return data || [];
  } catch {
    return [];
  }
}

export async function setAlertStatus(db: DB, companyId: string, id: string, status: AlertStatus): Promise<boolean> {
  if (!db || !companyId || !id) return false;
  try {
    const { error } = await db.from('alerts').update({ status }).eq('id', id).eq('company_id', companyId);
    return !error;
  } catch {
    return false;
  }
}
