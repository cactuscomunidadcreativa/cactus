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
