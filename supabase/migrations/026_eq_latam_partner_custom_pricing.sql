-- ============================================================
-- EQ LATAM — Partner custom pricing
-- ============================================================
-- Each partner can save their own preferred retail prices that
-- pre-populate the cotizador. Stored as JSONB with shape:
--
-- {
--   "full_eq_week_retail_per_pax_usd": 2800,
--   "services": {
--     "COACH_1H": 220,
--     "WORKSHOP_HALF": 1700,
--     ...
--   }
-- }
--
-- Empty default = falls back to platform-suggested retail.
-- ============================================================

alter table public.eq_partners
  add column if not exists custom_pricing jsonb not null default '{}'::jsonb;

-- ============================================================
-- RLS: partner contacts can update their own partner's pricing
-- ============================================================
-- The existing eq_partners policies cover SELECT for partner contacts
-- (via eq_partner_id_for_auth()). For UPDATE, we add a dedicated policy
-- so partner contacts can write only the custom_pricing field of their
-- own partner row.
--
-- We can't restrict to a single column at the policy level, but we
-- enforce via the API route or with a column-level check at the app.
-- Here we allow UPDATE for the partner's own row; the eq_partners_admin_write
-- already grants full write to admin.

create policy if not exists eq_partners_self_update on eq_partners
  for update
  using (id = eq_partner_id_for_auth())
  with check (id = eq_partner_id_for_auth());
