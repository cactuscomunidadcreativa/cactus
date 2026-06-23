-- ════════════════════════════════════════════════════════════════════════════
-- 044 · Dedup de empresas/organizaciones + invariante anti-duplicados.
-- Limpia creaciones parciales/duplicadas (p. ej. una empresa HUÉRFANA sin
-- membresía, que nadie puede ver) y previene la recurrencia con un índice único.
-- 100% idempotente: re-correr no hace nada. Espejado en src/lib/cactus/schema-sql.ts.
-- ════════════════════════════════════════════════════════════════════════════

-- A) Empresas HUÉRFANAS (sin ninguna membresía): inaccesibles → borra. No se
--    borra si es la empresa primaria de algún perfil (seguridad extra).
--    company_id en cactus_* es ON DELETE SET NULL → NO se borran datos del usuario.
DELETE FROM public.companies c
 WHERE NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.company_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.primary_company_id = c.id);

-- B) Organizaciones HUÉRFANAS (sin empresas): borra.
DELETE FROM public.organizations o
 WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.org_id = o.id);

-- C) A lo sumo UNA empresa "default" (slug NULL = auto-aprovisionada) por org:
--    deja la más antigua y a las extra dales un slug derivado de su id, para
--    que el índice (D) sea creable sin colisiones.
UPDATE public.companies c
   SET slug = 'empresa-' || left(md5(c.id::text), 6)
 WHERE c.slug IS NULL
   AND c.id <> (
     SELECT c2.id FROM public.companies c2
      WHERE c2.org_id = c.org_id AND c2.slug IS NULL
      ORDER BY c2.created_at ASC, c2.id ASC LIMIT 1
   );

-- D) Invariante: una sola empresa default (slug NULL) por organización. Esto
--    bloquea a nivel BD un segundo auto-aprovisionamiento en la misma org, aun
--    si el advisory lock de cactus_ensure_default_company se sortea.
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_default_per_org
  ON public.companies(org_id) WHERE slug IS NULL;
