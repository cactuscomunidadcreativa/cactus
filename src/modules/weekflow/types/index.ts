export interface WFTeam {
  id: string;
  name: string;
  code: string;
  created_by: string;
  settings: Record<string, any>;
  created_at: string;
}

export interface WFMember {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'member';
  avatar: string;
  joined_at: string;
}

export interface WFTask {
  id: string;
  team_id: string;
  member_id: string;
  section: 'personal' | 'show_and_tell' | 'to_discuss' | 'focus';
  text: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'pending' | 'completed';
  week_start: string;
  start_date: string | null;
  due_date: string | null;
  visibility: 'private' | 'team';
  created_at: string;
  completed_at: string | null;
  updated_at: string | null;
  // Populated from join
  assignees?: WFTaskAssignee[];
}

export interface WFTaskAssignee {
  id: string;
  task_id: string;
  member_id: string;
  assigned_at: string;
  // Populated from join
  member?: WFMember;
}

export interface WFMood {
  id: string;
  team_id: string;
  member_id: string;
  mood: number;
  energy: number;
  note: string | null;
  emotion_data: EmotionData | null;
  week_start: string;
  created_at: string;
}

export interface EmotionData {
  emotion: string;
  intensityKey: string;
  intensity: number;
  label: string;
  color: string;
}

export interface TeamPulse {
  avgMood: number;
  avgEnergy: number;
  totalCheckins: number;
}

export type Section = 'personal' | 'show_and_tell' | 'to_discuss' | 'focus';
export type Priority = 'normal' | 'important' | 'urgent';
export type Visibility = 'private' | 'team';
