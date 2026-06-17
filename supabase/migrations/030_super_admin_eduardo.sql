-- ============================================================================
-- 030 · Super-admin: eduardo@cactuscomunidadcreativa.com
-- Idempotente. Pone role='super_admin' al fundador. El acceso también está
-- garantizado por ENV (SUPER_ADMIN_EMAILS) en src/lib/admin/auth.ts.
-- ============================================================================

UPDATE public.profiles p
SET role = 'super_admin',
    updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = 'eduardo@cactuscomunidadcreativa.com'
  AND COALESCE(p.role, 'user') <> 'super_admin';

-- Auditoría (best-effort; ignora si la tabla aún no existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'admin_audit_log') THEN
    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
    SELECT u.id, 'user_promoted', 'profiles', u.id::text,
           jsonb_build_object('email', u.email, 'new_role', 'super_admin', 'via', 'migration_030')
    FROM auth.users u
    WHERE lower(u.email) = 'eduardo@cactuscomunidadcreativa.com';
  END IF;
END $$;
