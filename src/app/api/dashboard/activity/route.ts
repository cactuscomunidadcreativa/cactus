import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Recent AI generations
  const { data: generations } = await supabase
    .from('rm_generations')
    .select('id, prompt, status, model, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent content items
  const { data: contents } = await supabase
    .from('rm_contents')
    .select('id, title, platform, status, content_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent completed tasks (via member IDs)
  const { data: members } = await supabase
    .from('wf_members')
    .select('id')
    .eq('user_id', user.id);

  const memberIds = (members || []).map((m: any) => m.id);
  let completedTasks: any[] = [];

  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('wf_tasks')
      .select('id, text, status, completed_at, section')
      .in('member_id', memberIds)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);
    completedTasks = data || [];
  }

  // Merge and sort by date
  const activity = [
    ...(generations || []).map((g: any) => ({
      type: 'generation' as const,
      title: g.prompt ? (g.prompt.length > 60 ? g.prompt.slice(0, 60) + '...' : g.prompt) : 'AI Generation',
      detail: g.model || '',
      status: g.status,
      date: g.created_at,
    })),
    ...(contents || []).map((c: any) => ({
      type: 'content' as const,
      title: c.title || c.content_type || 'Content',
      detail: c.platform || '',
      status: c.status,
      date: c.created_at,
    })),
    ...completedTasks.map((t: any) => ({
      type: 'task' as const,
      title: t.text ? (t.text.length > 60 ? t.text.slice(0, 60) + '...' : t.text) : 'Task',
      detail: t.section || '',
      status: 'completed',
      date: t.completed_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return NextResponse.json({ activity });
}
