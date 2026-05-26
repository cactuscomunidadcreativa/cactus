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
