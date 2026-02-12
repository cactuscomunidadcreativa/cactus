-- ============================================
-- WEEKFLOW MODULE - Schema
-- ============================================

-- Teams
CREATE TABLE public.wf_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Members (linked to auth users)
CREATE TABLE public.wf_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.wf_teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar TEXT DEFAULT '🌵',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Tasks
CREATE TABLE public.wf_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.wf_teams(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.wf_members(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('personal', 'show_and_tell', 'to_discuss', 'focus')),
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Moods
CREATE TABLE public.wf_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.wf_teams(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.wf_members(id) ON DELETE CASCADE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  note TEXT,
  emotion_data JSONB,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, week_start)
);

-- Indexes
CREATE INDEX idx_wf_members_team ON public.wf_members(team_id);
CREATE INDEX idx_wf_members_user ON public.wf_members(user_id);
CREATE INDEX idx_wf_tasks_team_week ON public.wf_tasks(team_id, week_start);
CREATE INDEX idx_wf_tasks_member ON public.wf_tasks(member_id);
CREATE INDEX idx_wf_moods_team_week ON public.wf_moods(team_id, week_start);
CREATE INDEX idx_wf_teams_code ON public.wf_teams(code);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.wf_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_moods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper functions (SECURITY DEFINER to bypass RLS)
-- Prevents infinite recursion when wf_members policies
-- need to query wf_members itself.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM public.wf_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(check_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wf_members
    WHERE team_id = check_team_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Teams: members can read their teams
CREATE POLICY "Members can read their teams"
  ON public.wf_teams FOR SELECT
  USING (
    id IN (SELECT public.get_my_team_ids())
  );

-- Teams: authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
  ON public.wf_teams FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Teams: admins can update their teams
CREATE POLICY "Admins can update their teams"
  ON public.wf_teams FOR UPDATE
  USING (public.is_team_admin(id));

-- Teams: anyone can read by code (for joining)
CREATE POLICY "Anyone can lookup team by code"
  ON public.wf_teams FOR SELECT
  TO authenticated
  USING (true);

-- Members: team members can read other members
CREATE POLICY "Team members can read members"
  ON public.wf_members FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT public.get_my_team_ids()));

-- Members: authenticated users can join teams
CREATE POLICY "Users can join teams"
  ON public.wf_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Members: users can update their own membership
CREATE POLICY "Users can update own membership"
  ON public.wf_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Members: admins can update any member in their team
CREATE POLICY "Admins can update team members"
  ON public.wf_members FOR UPDATE
  TO authenticated
  USING (public.is_team_admin(team_id));

-- Members: admins can remove members (or self)
CREATE POLICY "Admins can remove members"
  ON public.wf_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_team_admin(team_id)
  );

-- Tasks: team members can read tasks
CREATE POLICY "Team members can read tasks"
  ON public.wf_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.team_id = wf_tasks.team_id
      AND wf_members.user_id = auth.uid()
    )
  );

-- Tasks: members can create tasks for themselves
CREATE POLICY "Members can create own tasks"
  ON public.wf_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.id = wf_tasks.member_id
      AND wf_members.user_id = auth.uid()
    )
  );

-- Tasks: members can update their own tasks
CREATE POLICY "Members can update own tasks"
  ON public.wf_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.id = wf_tasks.member_id
      AND wf_members.user_id = auth.uid()
    )
  );

-- Tasks: members can delete their own tasks
CREATE POLICY "Members can delete own tasks"
  ON public.wf_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.id = wf_tasks.member_id
      AND wf_members.user_id = auth.uid()
    )
  );

-- Moods: team members can read moods
CREATE POLICY "Team members can read moods"
  ON public.wf_moods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.team_id = wf_moods.team_id
      AND wf_members.user_id = auth.uid()
    )
  );

-- Moods: members can upsert their own mood
CREATE POLICY "Members can create own moods"
  ON public.wf_moods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.id = wf_moods.member_id
      AND wf_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own moods"
  ON public.wf_moods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.id = wf_moods.member_id
      AND wf_members.user_id = auth.uid()
    )
  );
