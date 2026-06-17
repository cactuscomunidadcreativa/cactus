-- ============================================================================
-- 032 · Fix: "infinite recursion detected in policy for relation agave_client_users"
-- La política SELECT de agave_client_users hacía un SELECT sobre la MISMA tabla
-- (cláusula client_id IN (SELECT ... FROM agave_client_users ...)), lo que causa
-- recursión infinita y cascada a clients/products/queries.
-- Fix: el usuario ve SUS propias filas; el super-admin ve todo. Sin auto-referencia.
-- ============================================================================

DROP POLICY IF EXISTS "User sees own client users" ON public.agave_client_users;

CREATE POLICY "User sees own client users"
  ON public.agave_client_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
  );
