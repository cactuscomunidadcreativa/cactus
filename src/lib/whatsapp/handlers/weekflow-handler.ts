import { createServerClient } from '@supabase/ssr';

const getSupabase = () => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { getAll: () => [], setAll: () => {} } }
);

/**
 * WeekFlow handler: create tasks, list tasks via WhatsApp.
 */
export async function handleWeekflowMessage(
  userId: string,
  action: string,
  data?: string
): Promise<string> {
  const supabase = getSupabase();

  switch (action) {
    case 'activate':
      return '📋 Modo WeekFlow activado.\nEscribe tu tarea o "menu" para volver.';

    case 'create_task': {
      if (!data) return 'Escribe: tarea [texto de la tarea]';

      // Find user's first team
      const { data: member } = await supabase
        .from('wf_members')
        .select('id, team_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (!member) {
        return 'No perteneces a ningún equipo en WeekFlow. Crea uno desde la plataforma.';
      }

      // Get current week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const weekStart = monday.toISOString().split('T')[0];

      await supabase.from('wf_tasks').insert({
        team_id: member.team_id,
        member_id: member.id,
        section: 'personal',
        text: data,
        priority: 'normal',
        status: 'pending',
        week_start: weekStart,
        visibility: 'team',
      });

      return `✅ Tarea creada: "${data}"`;
    }

    case 'list_tasks': {
      const { data: member } = await supabase
        .from('wf_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (!member) return 'No perteneces a ningún equipo en WeekFlow.';

      const { data: tasks } = await supabase
        .from('wf_tasks')
        .select('text, status, priority')
        .eq('member_id', member.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!tasks || tasks.length === 0) {
        return '📋 No tienes tareas pendientes.';
      }

      const list = tasks.map((t: any, i: number) => {
        const priority = t.priority === 'urgent' ? '🔴' : t.priority === 'important' ? '🟡' : '⚪';
        return `${i + 1}. ${priority} ${t.text}`;
      }).join('\n');

      return `📋 Tus tareas pendientes:\n\n${list}`;
    }

    case 'message':
      // General message in WeekFlow mode — treat as new task
      if (data) {
        return handleWeekflowMessage(userId, 'create_task', data);
      }
      return '📋 Modo WeekFlow. Escribe tu tarea o "menu" para volver.';

    default:
      return '📋 Modo WeekFlow. Escribe tu tarea o "menu" para volver.';
  }
}
