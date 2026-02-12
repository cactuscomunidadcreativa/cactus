-- ============================================
-- WEEKFLOW V2 - Extended Features
-- Adds: task assignments, dates, visibility, week navigation
-- ============================================

-- Add new columns to wf_tasks
ALTER TABLE public.wf_tasks
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'team'
    CHECK (visibility IN ('private', 'team')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Task assignments (many-to-many: a task can be assigned to multiple members)
CREATE TABLE IF NOT EXISTS public.wf_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.wf_tasks(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.wf_members(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, member_id)
);

-- Indexes for task assignees
CREATE INDEX IF NOT EXISTS idx_wf_task_assignees_task ON public.wf_task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_wf_task_assignees_member ON public.wf_task_assignees(member_id);

-- Index for due date queries
CREATE INDEX IF NOT EXISTS idx_wf_tasks_due_date ON public.wf_tasks(due_date);

-- RLS for task assignees
ALTER TABLE public.wf_task_assignees ENABLE ROW LEVEL SECURITY;

-- Task assignees: team members can read assignees
CREATE POLICY "Team members can read task assignees"
  ON public.wf_task_assignees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_tasks t
      JOIN public.wf_members m ON m.team_id = t.team_id
      WHERE t.id = wf_task_assignees.task_id
      AND m.user_id = auth.uid()
    )
  );

-- Task assignees: task owner can manage assignees
CREATE POLICY "Task owner can manage assignees"
  ON public.wf_task_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wf_tasks t
      JOIN public.wf_members m ON m.id = t.member_id
      WHERE t.id = wf_task_assignees.task_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Task owner can remove assignees"
  ON public.wf_task_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wf_tasks t
      JOIN public.wf_members m ON m.id = t.member_id
      WHERE t.id = wf_task_assignees.task_id
      AND m.user_id = auth.uid()
    )
  );

-- Update wf_tasks policy to handle visibility
-- Private tasks in personal section: only visible to owner and assignees
-- Team tasks: visible to all team members (existing behavior)
DROP POLICY IF EXISTS "Team members can read tasks" ON public.wf_tasks;
CREATE POLICY "Team members can read tasks"
  ON public.wf_tasks FOR SELECT
  USING (
    -- Team visibility: any team member can see
    (visibility = 'team' AND EXISTS (
      SELECT 1 FROM public.wf_members
      WHERE wf_members.team_id = wf_tasks.team_id
      AND wf_members.user_id = auth.uid()
    ))
    OR
    -- Private visibility: only owner or assignees can see
    (visibility = 'private' AND (
      EXISTS (
        SELECT 1 FROM public.wf_members
        WHERE wf_members.id = wf_tasks.member_id
        AND wf_members.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.wf_task_assignees ta
        JOIN public.wf_members m ON m.id = ta.member_id
        WHERE ta.task_id = wf_tasks.id
        AND m.user_id = auth.uid()
      )
    ))
  );
