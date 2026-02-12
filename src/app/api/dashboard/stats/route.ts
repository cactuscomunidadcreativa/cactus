import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getMonthKey } from '@/lib/utils';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const monthStart = getMonthKey();

  // Ramona: content created this month
  const { count: contentCount } = await supabase
    .from('rm_contents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart);

  // Ramona: AI generations this month
  const { count: generationCount } = await supabase
    .from('rm_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart);

  // WeekFlow: get member IDs for this user
  const { data: members } = await supabase
    .from('wf_members')
    .select('id')
    .eq('user_id', user.id);

  const memberIds = (members || []).map((m: any) => m.id);
  let tasksCompleted = 0;
  let tasksPending = 0;
  let moodTrend: { week: string; mood: number; energy: number }[] = [];

  if (memberIds.length > 0) {
    // Tasks completed this month
    const { count: completed } = await supabase
      .from('wf_tasks')
      .select('*', { count: 'exact', head: true })
      .in('member_id', memberIds)
      .eq('status', 'completed')
      .gte('completed_at', monthStart);
    tasksCompleted = completed || 0;

    // Tasks pending
    const { count: pending } = await supabase
      .from('wf_tasks')
      .select('*', { count: 'exact', head: true })
      .in('member_id', memberIds)
      .neq('status', 'completed');
    tasksPending = pending || 0;

    // Mood trend: last 4 entries
    const { data: moods } = await supabase
      .from('wf_moods')
      .select('mood, energy, week_start')
      .in('member_id', memberIds)
      .order('week_start', { ascending: false })
      .limit(4);

    moodTrend = (moods || []).reverse().map((m: any) => ({
      week: m.week_start,
      mood: m.mood,
      energy: m.energy,
    }));
  }

  return NextResponse.json({
    contentGenerated: contentCount || 0,
    aiGenerations: generationCount || 0,
    tasksCompleted,
    tasksPending,
    moodTrend,
  });
}
