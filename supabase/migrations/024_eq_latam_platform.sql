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
