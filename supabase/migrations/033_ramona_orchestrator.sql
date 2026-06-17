-- ============================================================================
-- 033 · Ramona Orquestadora — workspace funcional
-- Proyectos del usuario, tareas asignadas a agentes-cactus (con progreso),
-- conversación persistida con Ramona y entregables generados por los agentes.
-- Idempotente. RLS: cada usuario ve/escribe lo suyo; el service_role pasa por encima.
-- ============================================================================

-- ── Proyectos (objetivo + equipo + estado) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id  uuid REFERENCES public.cactus_brand_kits(id) ON DELETE SET NULL,
  name          text NOT NULL,
  objective     text,
  summary       text,
  status        text NOT NULL DEFAULT 'active',   -- active | paused | done
  is_active     boolean DEFAULT true,             -- proyecto enfocado del usuario
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_projects_user ON public.cactus_projects(user_id);

-- ── Tareas: cada paso del plan asignado a un agente ─────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_project_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  agent_slug    text NOT NULL,
  action        text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',  -- pending | in_progress | review | done
  progress      integer NOT NULL DEFAULT 0,       -- 0..100
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_tasks_user ON public.cactus_project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_tasks_project ON public.cactus_project_tasks(project_id);

-- ── Conversación con Ramona (persistida por proyecto) ───────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_project_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  role          text NOT NULL,                    -- user | assistant
  content       text NOT NULL,
  plan          jsonb,                             -- plan generado, si aplica
  credits       integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_messages_user ON public.cactus_project_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_messages_project ON public.cactus_project_messages(project_id);

-- ── Entregables generados por los agentes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_deliverables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  task_id       uuid REFERENCES public.cactus_project_tasks(id) ON DELETE SET NULL,
  agent_slug    text,
  title         text NOT NULL,
  kind          text NOT NULL DEFAULT 'doc',      -- doc | deck | data | image | video | audio | note
  status        text NOT NULL DEFAULT 'ready',    -- draft | review | ready
  content       text,
  url           text,
  meta          jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_user ON public.cactus_deliverables(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_project ON public.cactus_deliverables(project_id);

-- ── updated_at automático ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cactus_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cactus_projects','cactus_project_tasks','cactus_deliverables'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

-- ── RLS: dueño por user_id ──────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cactus_projects','cactus_project_tasks','cactus_project_messages','cactus_deliverables'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS %1$s_owner ON public.%1$I;
      CREATE POLICY %1$s_owner ON public.%1$I
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;
