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
  'EQ Latam',
  'Six Seconds Latam operating platform — areas, partners, deals, KPIs',
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
