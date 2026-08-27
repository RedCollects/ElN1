create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  position integer,
  current_price numeric(12, 2) not null default 0,
  active boolean not null default true,
  phone text,
  whatsapp text,
  logo_url text,
  instagram text,
  facebook text,
  tiktok text,
  created_at timestamptz not null default now()
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id),
  business_name text not null,
  category text,
  position integer not null,
  amount numeric(12, 2) not null,
  status text not null default 'pending',
  payment_id text,
  preference_id text,
  created_at timestamptz not null default now()
);

alter table public.businesses
  add column if not exists position integer,
  add column if not exists current_price numeric(12, 2) not null default 0,
  add column if not exists active boolean not null default true;

alter table public.bids
  add column if not exists status text not null default 'pending',
  add column if not exists payment_id text,
  add column if not exists preference_id text;

create unique index if not exists bids_payment_id_unique
  on public.bids (payment_id)
  where payment_id is not null;

create unique index if not exists bids_preference_id_unique
  on public.bids (preference_id)
  where preference_id is not null;

alter table public.businesses enable row level security;
alter table public.bids enable row level security;

drop policy if exists "Public can view active businesses" on public.businesses;
create policy "Public can view active businesses"
  on public.businesses for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public cannot write businesses" on public.businesses;
create policy "Public cannot write businesses"
  on public.businesses for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Public cannot access bids" on public.bids;
create policy "Public cannot access bids"
  on public.bids for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists businesses_active_position_idx
  on public.businesses (position)
  where active = true;

create unique index if not exists businesses_active_position_unique
  on public.businesses (position)
  where active = true and position is not null;

create or replace function public.settle_bid(p_bid_id text, p_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_bid public.bids%rowtype;
  inserted_business public.businesses%rowtype;
  position_is_occupied boolean;
begin
  select * into selected_bid
  from public.bids
  where id::text = p_bid_id
  for update;

  if not found then
    raise exception 'Oferta no encontrada';
  end if;

  if selected_bid.status = 'paid' then
    return jsonb_build_object('success', true, 'already_paid', true);
  end if;

  if selected_bid.position < 1 or selected_bid.position > 50 then
    raise exception 'La posición de la oferta no es válida';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.businesses.ranking'));

  select exists(
    select 1
    from public.businesses
    where active = true and position = selected_bid.position
  ) into position_is_occupied;

  if position_is_occupied then
    update public.businesses
    set position = position + 1000
    where active = true
      and position >= selected_bid.position;

    update public.businesses
    set position = position - 999
    where active = true
      and position >= selected_bid.position + 1000;

    update public.businesses
    set active = false, position = null
    where active = true
      and position > 50;
  end if;

  insert into public.businesses (name, category, current_price, position, active)
  values (selected_bid.business_name, coalesce(selected_bid.category, 'General'), selected_bid.amount, selected_bid.position, true)
  returning * into inserted_business;

  update public.bids
  set status = 'paid', payment_id = p_payment_id, business_id = inserted_business.id
  where id = selected_bid.id;

  return jsonb_build_object(
    'success', true,
    'business_id', inserted_business.id,
    'bid_id', selected_bid.id
  );
end;
$$;

revoke all on function public.settle_bid(text, text) from public;
grant execute on function public.settle_bid(text, text) to service_role;
