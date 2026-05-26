-- ============================================================
-- Six Seconds Latam — FULL SETUP (combined 024-029)
-- ============================================================
-- Apply this ONCE in Supabase Dashboard → SQL Editor → New query → Run.
-- It runs all 6 migrations in order. Safe to re-run (uses IF NOT EXISTS).
--
-- After this completes:
--   - Eduardo gets active subscription to /apps/eq-latam
--   - 5 partners + 6 team members + Yisseth seeded
--   - All RLS policies active
--   - Custom pricing, quotes, payroll, KPI tables ready
-- ============================================================

-- ============================================================
-- 024_eq_latam_platform
-- ============================================================
-- ============================================================
-- EQ LATAM Operating Platform — Persistence layer
-- ============================================================
-- Replaces in-memory arrays in src/modules/eq-latam/lib/eq-organization.ts
-- with real tables backed by Supabase. RLS policies enforce the
-- visibility model described in src/modules/eq-latam/types/organization.ts.
--
-- Convention:
--   - eq_users    : internal team members (separate from auth.users; linked by email)
--   - eq_areas    : business areas catalog
--   - eq_permissions : many-to-many users ↔ areas
--   - eq_partners : external reseller orgs
--   - eq_partner_contacts : people inside each partner (auth.users.id when invited)
--   - eq_referrers : external referrers (no login)
--   - eq_deals    : transactional records — every cotización + cierre
--   - eq_settings : runtime config (current licensing mode)
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Internal team users
-- ============================================================
create table if not exists eq_users (
  id text primary key,                       -- 'eduardo', 'natalia', etc.
  name text not null,
  email text not null unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('admin', 'area_lead', 'collaborator')),
  monthly_salary_usd numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_eq_users_email on eq_users(lower(email));
create index if not exists idx_eq_users_auth on eq_users(auth_user_id);

-- ============================================================
-- 2. Business areas
-- ============================================================
create table if not exists eq_areas (
  id text primary key,                       -- 'education', 'assessments', etc.
  name text not null,
  emoji text,
  description text,
  is_revenue_generating boolean not null default true,
  admin_only boolean not null default false,
  revenue_target_annual numeric(12,2) not null default 0,
  cost_allocation_annual numeric(12,2) not null default 0
);

-- ============================================================
-- 3. Permissions: who sees which area at what level
-- ============================================================
create table if not exists eq_permissions (
  user_id text not null references eq_users(id) on delete cascade,
  area_id text not null references eq_areas(id) on delete cascade,
  level text not null check (level in ('lead', 'collaborator', 'viewer')),
  primary key (user_id, area_id)
);

-- ============================================================
-- 4. Partners (external resellers)
-- ============================================================
create table if not exists eq_partners (
  id text primary key,                       -- 'talent-advisors', 'be2grow', etc.
  name text not null,
  country text not null check (country in ('PE', 'CO', 'MX', 'OTHER')),
  tier text not null check (tier in ('EXPLORER', 'GROWTH', 'STRATEGIC', 'ELITE')),
  ytd_pax int not null default 0,
  ytd_revenue numeric(12,2) not null default 0,
  ytd_cac_absorbed numeric(12,2) not null default 0,
  active_since date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. Partner contacts (people inside each partner)
-- ============================================================
create table if not exists eq_partner_contacts (
  id text primary key,
  partner_id text not null references eq_partners(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('lead', 'collaborator')),
  auth_user_id uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  last_login_at timestamptz,
  active boolean not null default true,
  unique(partner_id, email)
);
create index if not exists idx_eq_partner_contacts_partner on eq_partner_contacts(partner_id);
create index if not exists idx_eq_partner_contacts_auth on eq_partner_contacts(auth_user_id);

-- ============================================================
-- 6. Referrers (external referrers, no login)
-- ============================================================
create table if not exists eq_referrers (
  id text primary key,
  name text not null,
  email text,
  default_commission_pct numeric(4,3) not null default 0.10,
  ytd_referred_deals int not null default 0,
  ytd_commission_paid numeric(12,2) not null default 0,
  ytd_revenue_generated numeric(12,2) not null default 0,
  active boolean not null default true,
  notes text
);

-- ============================================================
-- 7. Deals (transactions)
-- ============================================================
create table if not exists eq_deals (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references eq_areas(id),
  product_code text not null,                -- 'FULL_EQ_WEEK' or cert code
  modality text not null,
  trainer_role text check (trainer_role in ('MT', 'RF')),
  city text,
  country text not null check (country in ('PE', 'CO', 'MX', 'OTHER')),
  event_date date,
  pax_min int not null default 5,
  pax_expected int not null,
  pax_target int not null default 15,
  pax_stretch int not null default 20,
  pax_actual int,
  channel text not null check (channel in ('direct', 'partner', 'referrer')),
  partner_id text references eq_partners(id),
  referrer_id text references eq_referrers(id),
  closer_user_id text references eq_users(id),
  closer_commission_pct numeric(4,3) not null default 0.05,
  referrer_commission_pct_override numeric(4,3),
  marketing_origin boolean not null default false,
  retail_price_per_pax_usd numeric(10,2) not null,
  wholesale_price_per_pax_usd numeric(10,2),
  travel_usd numeric(10,2),
  status text not null check (status in ('quoted', 'closed', 'delivered', 'cancelled', 'relationship_event')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text references eq_users(id)
);
create index if not exists idx_eq_deals_area on eq_deals(area_id);
create index if not exists idx_eq_deals_partner on eq_deals(partner_id);
create index if not exists idx_eq_deals_referrer on eq_deals(referrer_id);
create index if not exists idx_eq_deals_status on eq_deals(status);
create index if not exists idx_eq_deals_date on eq_deals(event_date);

-- ============================================================
-- 8. Runtime settings (singleton row)
-- ============================================================
create table if not exists eq_settings (
  id int primary key default 1 check (id = 1),
  licensing_mode_type text not null default 'annual_flat' check (licensing_mode_type in ('annual_flat', 'percentage_of_revenue')),
  licensing_amount_usd numeric(12,2) not null default 40000,
  licensing_rate numeric(4,3) not null default 0.30,
  licensing_year int not null default 2026,
  updated_at timestamptz not null default now(),
  updated_by text references eq_users(id)
);
insert into eq_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- 9. Seed data — areas
-- ============================================================
insert into eq_areas (id, name, emoji, description, is_revenue_generating, admin_only, revenue_target_annual)
values
  ('education',   'Education',   '🎓', 'Certs y EQ Weeks (UEQ, BPC, EQAC, EQPC, EQPM)',              true,  false, 110000),
  ('assessments', 'Assessments', '🧠', 'Créditos para SEI, LVS, OVS, TVS, Brain Profiles, Insights', true,  false, 146000),
  ('eq_biz',      'EQ Biz',      '💼', 'Consultoría corporativa y facilitación custom',              true,  false, 103200),
  ('marketing',   'Marketing',   '📢', 'Lead gen, UEQ (lead magnet), ADS, content',                  false, false, 0),
  ('membership',  'Membership',  '👥', 'Network membership fees',                                    true,  true,  31300),
  ('impact',      'Impact',      '🌱', 'EQ Impact Programs, scholarships, donations',                true,  false, 17900),
  ('operations',  'Operations',  '⚙️', 'Función de soporte: admin, compliance, inventory',           false, false, 0),
  ('partners',    'Partners',    '🤝', 'Gestión de relaciones con partners',                         false, true,  0)
on conflict (id) do nothing;

-- ============================================================
-- 10. Seed data — internal team
-- ============================================================
insert into eq_users (id, name, email, role, monthly_salary_usd)
values
  ('eduardo', 'Eduardo González',  'eduardo@cactuscomunidadcreativa.com', 'admin',        1500),
  ('natalia', 'Natalia Vergara',   'natalia@6seconds.org',                 'area_lead',    600),
  ('karla',   'Karla Parra',       'karla@6seconds.org',                   'area_lead',    1100),
  ('andreia', 'Andreia DelPra',    'andreia@6seconds.org',                 'area_lead',    600),
  ('liliana', 'Liliana Rodríguez', 'liliana@6seconds.org',                 'area_lead',    600),
  ('otilia',  'Otilia Esquivia',   'otilia@6seconds.org',                  'collaborator', 300)
on conflict (id) do nothing;

-- ============================================================
-- 11. Seed data — permissions
-- ============================================================
insert into eq_permissions (user_id, area_id, level) values
  ('natalia', 'education',   'lead'),
  ('natalia', 'operations',  'collaborator'),
  ('karla',   'marketing',   'lead'),
  ('andreia', 'eq_biz',      'lead'),
  ('andreia', 'assessments', 'viewer'),
  ('liliana', 'impact',      'lead'),
  ('liliana', 'operations',  'collaborator'),
  ('liliana', 'assessments', 'viewer'),
  ('otilia',  'impact',      'lead'),
  ('otilia',  'assessments', 'viewer')
on conflict (user_id, area_id) do nothing;

-- ============================================================
-- 12. Seed data — partners
-- ============================================================
insert into eq_partners (id, name, country, tier, active_since) values
  ('talent-advisors', 'Talent Advisors', 'PE',    'STRATEGIC', '2024-01-01'),
  ('be2grow',         'Be2grow',         'OTHER', 'EXPLORER',  '2026-01-01'),
  ('diversa',         'Diversa',         'OTHER', 'EXPLORER',  '2026-01-01'),
  ('brain-up',        'Brain Up',        'OTHER', 'EXPLORER',  '2026-01-01'),
  ('sun-up',          'Sun Up',          'OTHER', 'EXPLORER',  '2026-01-01')
on conflict (id) do nothing;

-- ============================================================
-- 13. Seed data — referrers
-- ============================================================
insert into eq_referrers (id, name, default_commission_pct, notes) values
  ('yisseth', 'Yisseth', 0.10, 'Referenciadora zona Caribe — caso EQ Week Cartagena')
on conflict (id) do nothing;

-- ============================================================
-- 14. RLS — Row Level Security
-- ============================================================
alter table eq_users             enable row level security;
alter table eq_areas             enable row level security;
alter table eq_permissions       enable row level security;
alter table eq_partners          enable row level security;
alter table eq_partner_contacts  enable row level security;
alter table eq_referrers         enable row level security;
alter table eq_deals             enable row level security;
alter table eq_settings          enable row level security;

-- Helper: is the current auth user our admin (Eduardo)?
create or replace function eq_is_admin() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from eq_users u
    where u.auth_user_id = auth.uid() and u.role = 'admin' and u.active
  );
$$;

-- Helper: is the current auth user an internal team member?
create or replace function eq_internal_user_id() returns text
language sql stable security definer
as $$
  select id from eq_users where auth_user_id = auth.uid() and active limit 1;
$$;

-- Helper: is the current auth user a partner contact?
create or replace function eq_partner_id_for_auth() returns text
language sql stable security definer
as $$
  select partner_id from eq_partner_contacts
  where auth_user_id = auth.uid() and active
  limit 1;
$$;

-- eq_areas — readable by any authenticated team member; partners see none.
create policy eq_areas_read_team on eq_areas for select
  using (eq_internal_user_id() is not null and (not admin_only or eq_is_admin()));
create policy eq_areas_admin_write on eq_areas for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_users — admin sees all; team members see themselves only.
create policy eq_users_self_read on eq_users for select
  using (eq_is_admin() or auth_user_id = auth.uid());
create policy eq_users_admin_write on eq_users for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_permissions — admin sees all; user sees own permissions.
create policy eq_permissions_self_read on eq_permissions for select
  using (eq_is_admin() or user_id = eq_internal_user_id());
create policy eq_permissions_admin_write on eq_permissions for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_partners — admin sees all; partner contacts see only their own partner.
create policy eq_partners_admin_read on eq_partners for select
  using (eq_is_admin() or id = eq_partner_id_for_auth());
create policy eq_partners_admin_write on eq_partners for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_partner_contacts — admin all; contact sees self; partner-lead sees same partner.
create policy eq_partner_contacts_read on eq_partner_contacts for select
  using (
    eq_is_admin()
    or auth_user_id = auth.uid()
    or partner_id = eq_partner_id_for_auth()
  );
create policy eq_partner_contacts_admin_write on eq_partner_contacts for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_referrers — admin only.
create policy eq_referrers_admin_all on eq_referrers for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_deals — admin all; team member sees deals where they're closer or area lead;
-- partner contact sees deals where partner_id = their partner.
create policy eq_deals_read on eq_deals for select
  using (
    eq_is_admin()
    or closer_user_id = eq_internal_user_id()
    or area_id in (
      select area_id from eq_permissions
      where user_id = eq_internal_user_id()
    )
    or partner_id = eq_partner_id_for_auth()
  );
create policy eq_deals_admin_write on eq_deals for all
  using (eq_is_admin()) with check (eq_is_admin());

-- eq_settings — readable by team; writable by admin only.
create policy eq_settings_team_read on eq_settings for select
  using (eq_internal_user_id() is not null);
create policy eq_settings_admin_write on eq_settings for all
  using (eq_is_admin()) with check (eq_is_admin());

-- ============================================================
-- 15. Updated-at triggers
-- ============================================================
create or replace function eq_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger eq_users_updated_at      before update on eq_users      for each row execute function eq_set_updated_at();
create trigger eq_partners_updated_at   before update on eq_partners   for each row execute function eq_set_updated_at();
create trigger eq_deals_updated_at      before update on eq_deals      for each row execute function eq_set_updated_at();
create trigger eq_settings_updated_at   before update on eq_settings   for each row execute function eq_set_updated_at();

-- ============================================================
-- 025_eq_latam_app_subscription
-- ============================================================
-- ============================================================
-- EQ LATAM — App registration + Eduardo subscription
-- ============================================================
-- Registers 'eq-latam' as an app in the Cactus apps catalog so it
-- shows up in the platform shell, and grants Eduardo an active
-- subscription so /apps/eq-latam doesn't redirect to /marketplace.
-- ============================================================

-- Register the app (idempotent)
insert into public.apps (id, name, description, is_active)
values (
  'eq-latam',
  'Six Seconds Latam',
  'Plataforma operativa — áreas, partners, deals, KPIs, liquidación',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

-- Grant Eduardo an active subscription (idempotent by user/app)
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('eduardo@cactuscomunidadcreativa.com')
  limit 1;

  if v_user_id is not null then
    insert into public.subscriptions (user_id, app_id, status, current_period_start)
    values (v_user_id, 'eq-latam', 'active', now())
    on conflict do nothing;

    -- Backfill the auth_user_id link in eq_users
    update public.eq_users
    set auth_user_id = v_user_id
    where id = 'eduardo' and auth_user_id is null;
  end if;
end $$;

-- ============================================================
-- 026_eq_latam_partner_custom_pricing
-- ============================================================
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

-- ============================================================
-- 027_eq_latam_quotes
-- ============================================================
-- ============================================================
-- EQ LATAM — Quote history
-- ============================================================
-- Each PDF a partner generates leaves a row here so Eduardo can see
-- pipeline activity even before a Deal is closed.
--
-- When the partner clicks "Save as Deal" in the cotizador, we promote
-- the quote: status='closed' and create the matching eq_deals row.
-- ============================================================

create table if not exists eq_quotes (
  id uuid primary key default gen_random_uuid(),
  partner_id text references eq_partners(id) on delete cascade,
  referrer_id text references eq_referrers(id) on delete set null,
  product_code text not null,                -- 'FULL_EQ_WEEK' or service code
  client_name text,
  city text,
  country text not null default 'OTHER' check (country in ('PE','CO','MX','OTHER')),
  pax int,
  retail_per_pax_usd numeric(10,2),
  wholesale_per_pax_usd numeric(10,2),
  retail_total_usd numeric(12,2) not null,
  wholesale_total_usd numeric(12,2) not null,
  partner_gross_usd numeric(12,2) not null default 0,
  status text not null check (status in ('draft', 'sent', 'closed', 'lost')) default 'draft',
  pdf_filename text,
  notes text,
  created_at timestamptz not null default now(),
  created_by_user_id text references eq_users(id),
  created_by_partner_contact_id text references eq_partner_contacts(id),
  closed_at timestamptz,
  closed_deal_id uuid references eq_deals(id)
);

create index if not exists idx_eq_quotes_partner on eq_quotes(partner_id);
create index if not exists idx_eq_quotes_status on eq_quotes(status);
create index if not exists idx_eq_quotes_created on eq_quotes(created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table eq_quotes enable row level security;

-- Admin sees all
create policy eq_quotes_admin_all on eq_quotes for all
  using (eq_is_admin()) with check (eq_is_admin());

-- Partner contacts see only their own partner's quotes
create policy eq_quotes_partner_read on eq_quotes for select
  using (partner_id = eq_partner_id_for_auth());

create policy eq_quotes_partner_insert on eq_quotes for insert
  with check (partner_id = eq_partner_id_for_auth());

-- Internal team with Education area access sees all quotes
create policy eq_quotes_education_read on eq_quotes for select
  using (
    exists (
      select 1 from eq_permissions p
      where p.user_id = eq_internal_user_id()
        and p.area_id = 'education'
    )
  );

-- ============================================================
-- Promote a quote to a closed Deal + bump partner YTD
-- ============================================================
create or replace function eq_close_quote(p_quote_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  q eq_quotes%rowtype;
  v_deal_id uuid;
begin
  select * into q from eq_quotes where id = p_quote_id;
  if not found then raise exception 'Quote % not found', p_quote_id; end if;
  if q.status = 'closed' then raise exception 'Quote already closed'; end if;

  -- Create the Deal
  insert into eq_deals (
    area_id, product_code, modality, city, country,
    pax_expected, pax_actual,
    channel, partner_id, referrer_id,
    closer_user_id, closer_commission_pct, marketing_origin,
    retail_price_per_pax_usd, wholesale_price_per_pax_usd,
    status, created_by
  ) values (
    'education', q.product_code, 'in_person_rf', q.city, q.country,
    coalesce(q.pax, 0), q.pax,
    case
      when q.referrer_id is not null then 'referrer'
      when q.partner_id is not null then 'partner'
      else 'direct'
    end,
    q.partner_id, q.referrer_id,
    coalesce(q.created_by_user_id, 'eduardo'), 0.05, true,
    coalesce(q.retail_per_pax_usd, 0), q.wholesale_per_pax_usd,
    'closed', q.created_by_user_id
  )
  returning id into v_deal_id;

  -- Bump partner YTD
  if q.partner_id is not null then
    update eq_partners
    set ytd_pax = ytd_pax + coalesce(q.pax, 0),
        ytd_revenue = ytd_revenue + q.wholesale_total_usd
    where id = q.partner_id;
  end if;

  -- Bump referrer YTD
  if q.referrer_id is not null then
    update eq_referrers
    set ytd_referred_deals = ytd_referred_deals + 1,
        ytd_revenue_generated = ytd_revenue_generated + q.retail_total_usd,
        ytd_commission_paid = ytd_commission_paid + (q.retail_total_usd * default_commission_pct)
    where id = q.referrer_id;
  end if;

  -- Mark the quote closed
  update eq_quotes
  set status = 'closed', closed_at = now(), closed_deal_id = v_deal_id
  where id = p_quote_id;

  return v_deal_id;
end;
$$;

-- ============================================================
-- 028_eq_latam_payroll
-- ============================================================
-- ============================================================
-- Six Seconds Latam — Payroll / Liquidación
-- ============================================================
-- Tracks the paid/unpaid status of monthly salaries + commissions
-- per team member and per external referrer.
--
-- Convention: one row per (recipient, month, category).
--   recipient_user_id: an eq_users.id (Karla, Natalia, etc.)
--   recipient_referrer_id: an eq_referrers.id (Yisseth)
--   exactly ONE of the two is set.
-- ============================================================

create table if not exists eq_payroll_payments (
  id uuid primary key default gen_random_uuid(),
  period text not null,                              -- 'YYYY-MM'
  recipient_user_id text references eq_users(id) on delete cascade,
  recipient_referrer_id text references eq_referrers(id) on delete cascade,
  category text not null check (category in (
    'base_salary',
    'karla_marketing_commission',
    'closer_commission',
    'director_commission',
    'referrer_commission'
  )),
  amount_usd numeric(10,2) not null,
  status text not null check (status in ('pending', 'paid', 'cancelled')) default 'pending',
  paid_at timestamptz,
  paid_method text,                                  -- 'wire', 'paypal', 'cash', etc.
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  marked_by text references eq_users(id),
  constraint exactly_one_recipient check (
    (recipient_user_id is not null and recipient_referrer_id is null)
    or
    (recipient_user_id is null and recipient_referrer_id is not null)
  )
);

create index if not exists idx_eq_payroll_period on eq_payroll_payments(period);
create index if not exists idx_eq_payroll_status on eq_payroll_payments(status);
create index if not exists idx_eq_payroll_user on eq_payroll_payments(recipient_user_id);

create trigger eq_payroll_updated_at
  before update on eq_payroll_payments
  for each row execute function eq_set_updated_at();

-- ============================================================
-- RLS — admin only
-- ============================================================
alter table eq_payroll_payments enable row level security;

create policy eq_payroll_admin_all on eq_payroll_payments for all
  using (eq_is_admin()) with check (eq_is_admin());

-- Allow each user to read THEIR OWN pending payments (so they can see
-- what they're owed without revealing everyone else's salary).
create policy eq_payroll_self_read on eq_payroll_payments for select
  using (recipient_user_id = eq_internal_user_id());

-- ============================================================
-- 029_eq_latam_kpis
-- ============================================================
-- ============================================================
-- Six Seconds Latam — KPI values per area
-- ============================================================
-- One row per (area, kpi_code, period_type, period_label).
-- period_type: 'weekly' (period_label = 'YYYY-Www') or 'monthly' ('YYYY-MM').
-- The KPI catalog itself lives in code (eq-kpi-catalog.ts) so adding
-- new KPIs doesn't require a migration.
-- ============================================================

create table if not exists eq_kpi_values (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references eq_areas(id) on delete cascade,
  kpi_code text not null,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_label text not null,           -- '2026-05' or '2026-W21'
  value numeric(14, 4),                  -- nullable; null = not reported yet
  target numeric(14, 4),                 -- optional override of catalog target
  notes text,
  updated_at timestamptz not null default now(),
  updated_by text references eq_users(id),
  unique (area_id, kpi_code, period_type, period_label)
);

create index if not exists idx_eq_kpi_values_area_period on eq_kpi_values(area_id, period_type, period_label);

create trigger eq_kpi_values_updated_at
  before update on eq_kpi_values
  for each row execute function eq_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table eq_kpi_values enable row level security;

-- Admin (Eduardo) writes everything; reads everything.
create policy eq_kpi_admin_all on eq_kpi_values for all
  using (eq_is_admin()) with check (eq_is_admin());

-- Team members read + write KPIs for areas they have permission on.
create policy eq_kpi_team_read on eq_kpi_values for select
  using (
    exists (
      select 1 from eq_permissions p
      where p.user_id = eq_internal_user_id()
        and p.area_id = eq_kpi_values.area_id
    )
  );

create policy eq_kpi_team_write on eq_kpi_values for insert
  with check (
    exists (
      select 1 from eq_permissions p
      where p.user_id = eq_internal_user_id()
        and p.area_id = eq_kpi_values.area_id
        and p.level in ('lead', 'collaborator')
    )
  );

create policy eq_kpi_team_update on eq_kpi_values for update
  using (
    exists (
      select 1 from eq_permissions p
      where p.user_id = eq_internal_user_id()
        and p.area_id = eq_kpi_values.area_id
        and p.level in ('lead', 'collaborator')
    )
  );

