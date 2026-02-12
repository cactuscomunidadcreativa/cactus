'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getWeekStart } from '../lib/utils';
import type { WFTeam, WFMember, WFTask, WFMood, TeamPulse, Section, Priority, Visibility } from '../types';

export function useWeekFlow(teamId: string | null) {
  const supabase = createClient();
  const currentWeek = getWeekStart();

  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeek);
  const [team, setTeam] = useState<WFTeam | null>(null);
  const [members, setMembers] = useState<WFMember[]>([]);
  const [currentMember, setCurrentMember] = useState<WFMember | null>(null);
  const [tasks, setTasks] = useState<WFTask[]>([]);
  const [moods, setMoods] = useState<WFMood[]>([]);
  const [pulse, setPulse] = useState<TeamPulse>({ avgMood: 0, avgEnergy: 0, totalCheckins: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function clearError() {
    setError(null);
  }

  // Navigate between weeks
  function goToWeek(weekStart: string) {
    setSelectedWeek(weekStart);
  }

  function goToPreviousWeek() {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() - 7);
    setSelectedWeek(date.toISOString().split('T')[0]);
  }

  function goToNextWeek() {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() + 7);
    setSelectedWeek(date.toISOString().split('T')[0]);
  }

  function goToCurrentWeek() {
    setSelectedWeek(currentWeek);
  }

  const isCurrentWeek = selectedWeek === currentWeek;

  const loadData = useCallback(async () => {
    if (!teamId || !supabase) { setLoading(false); return; }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: teamData, error: teamErr } = await supabase
        .from('wf_teams')
        .select('*')
        .eq('id', teamId)
        .single();
      if (teamErr) throw teamErr;
      setTeam(teamData);

      const { data: membersData, error: membersErr } = await supabase
        .from('wf_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at');
      if (membersErr) throw membersErr;
      setMembers(membersData || []);

      const me = (membersData || []).find((m: WFMember) => m.user_id === user.id);
      setCurrentMember(me || null);

      // Load tasks for selected week + pending tasks from older weeks
      const { data: tasksData, error: tasksErr } = await supabase
        .from('wf_tasks')
        .select('*')
        .eq('team_id', teamId)
        .or(`week_start.eq.${selectedWeek},and(status.eq.pending,week_start.lt.${selectedWeek})`)
        .order('created_at');
      if (tasksErr) throw tasksErr;

      // Load assignees for these tasks
      const taskIds = (tasksData || []).map((t: WFTask) => t.id);
      let assigneesMap: Record<string, any[]> = {};

      if (taskIds.length > 0) {
        const { data: assigneesData } = await supabase
          .from('wf_task_assignees')
          .select('*')
          .in('task_id', taskIds);

        if (assigneesData) {
          for (const a of assigneesData) {
            if (!assigneesMap[a.task_id]) assigneesMap[a.task_id] = [];
            assigneesMap[a.task_id].push(a);
          }
        }
      }

      // Merge assignees into tasks
      const tasksWithAssignees = (tasksData || []).map((t: WFTask) => ({
        ...t,
        assignees: assigneesMap[t.id] || [],
      }));

      setTasks(tasksWithAssignees);

      // Load moods for selected week
      const { data: moodsData, error: moodsErr } = await supabase
        .from('wf_moods')
        .select('*')
        .eq('team_id', teamId)
        .eq('week_start', selectedWeek);
      if (moodsErr) throw moodsErr;
      setMoods(moodsData || []);

      if (moodsData && moodsData.length > 0) {
        const avgMood = moodsData.reduce((sum: number, m: WFMood) => sum + m.mood, 0) / moodsData.length;
        const avgEnergy = moodsData.reduce((sum: number, m: WFMood) => sum + m.energy, 0) / moodsData.length;
        setPulse({
          avgMood: Math.round(avgMood * 10) / 10,
          avgEnergy: Math.round(avgEnergy * 10) / 10,
          totalCheckins: moodsData.length,
        });
      } else {
        setPulse({ avgMood: 0, avgEnergy: 0, totalCheckins: 0 });
      }

      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [teamId, selectedWeek]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function addTask(
    text: string,
    section: Section,
    priority: Priority = 'normal',
    options?: {
      startDate?: string;
      dueDate?: string;
      visibility?: Visibility;
      assigneeIds?: string[];
    }
  ): Promise<boolean> {
    if (!currentMember || !teamId || !supabase) return false;
    try {
      const { data, error: err } = await supabase
        .from('wf_tasks')
        .insert({
          team_id: teamId,
          member_id: currentMember.id,
          section,
          text,
          priority,
          week_start: selectedWeek,
          start_date: options?.startDate || null,
          due_date: options?.dueDate || null,
          visibility: options?.visibility || 'team',
        })
        .select()
        .single();
      if (err) throw err;

      // Add assignees if provided
      if (data && options?.assigneeIds && options.assigneeIds.length > 0) {
        const assigneeRows = options.assigneeIds.map((memberId) => ({
          task_id: data.id,
          member_id: memberId,
        }));
        await supabase.from('wf_task_assignees').insert(assigneeRows);
      }

      if (data) setTasks((prev) => [...prev, { ...data, assignees: [] }]);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error adding task');
      return false;
    }
  }

  async function updateTask(
    taskId: string,
    updates: {
      text?: string;
      priority?: Priority;
      startDate?: string | null;
      dueDate?: string | null;
      visibility?: Visibility;
    }
  ): Promise<boolean> {
    if (!supabase) return false;
    try {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility;

      const { error: err } = await supabase
        .from('wf_tasks')
        .update(updateData)
        .eq('id', taskId);
      if (err) throw err;

      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, ...updateData } : t)
      );
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error updating task');
      return false;
    }
  }

  async function toggleTask(taskId: string): Promise<boolean> {
    if (!supabase) return false;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: newStatus, completed_at: completedAt } : t)
    );

    try {
      const { error: err } = await supabase
        .from('wf_tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', taskId);
      if (err) throw err;
      return true;
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: task.status, completed_at: task.completed_at } : t)
      );
      setError(err?.message || 'Error updating task');
      return false;
    }
  }

  async function deleteTask(taskId: string): Promise<boolean> {
    if (!supabase) return false;
    const taskToDelete = tasks.find((t) => t.id === taskId);

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const { error: err } = await supabase.from('wf_tasks').delete().eq('id', taskId);
      if (err) throw err;
      return true;
    } catch (err: any) {
      if (taskToDelete) setTasks((prev) => [...prev, taskToDelete]);
      setError(err?.message || 'Error deleting task');
      return false;
    }
  }

  async function assignTask(taskId: string, memberIds: string[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      // Remove existing assignees
      await supabase.from('wf_task_assignees').delete().eq('task_id', taskId);

      // Add new assignees
      if (memberIds.length > 0) {
        const rows = memberIds.map((memberId) => ({
          task_id: taskId,
          member_id: memberId,
        }));
        const { error: err } = await supabase.from('wf_task_assignees').insert(rows);
        if (err) throw err;
      }

      // Update local state
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? {
          ...t,
          assignees: memberIds.map((mid) => ({
            id: '',
            task_id: taskId,
            member_id: mid,
            assigned_at: new Date().toISOString(),
          })),
        } : t)
      );
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error assigning task');
      return false;
    }
  }

  async function saveMood(mood: number, energy: number, emotionData?: any): Promise<boolean> {
    if (!currentMember || !teamId || !supabase) return false;
    try {
      const { data, error: err } = await supabase
        .from('wf_moods')
        .upsert({
          team_id: teamId,
          member_id: currentMember.id,
          mood,
          energy,
          emotion_data: emotionData || null,
          week_start: selectedWeek,
        }, {
          onConflict: 'member_id,week_start',
        })
        .select()
        .single();
      if (err) throw err;

      if (data) {
        setMoods((prev) => {
          const existing = prev.findIndex((m) => m.member_id === currentMember.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data;
            return updated;
          }
          return [...prev, data];
        });
      }
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error saving mood');
      return false;
    }
  }

  async function updateMemberRole(memberId: string, role: 'admin' | 'member'): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error: err } = await supabase
        .from('wf_members')
        .update({ role })
        .eq('id', memberId);
      if (err) throw err;
      setMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, role } : m)
      );
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error updating role');
      return false;
    }
  }

  return {
    team,
    members,
    currentMember,
    tasks,
    moods,
    pulse,
    loading,
    error,
    clearError,
    weekStart: selectedWeek,
    currentWeek,
    isCurrentWeek,
    isAdmin: currentMember?.role === 'admin',
    // Week navigation
    goToWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    // Task actions
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    assignTask,
    // Other actions
    saveMood,
    updateMemberRole,
    refresh: loadData,
  };
}
