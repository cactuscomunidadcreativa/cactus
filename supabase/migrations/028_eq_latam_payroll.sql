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
