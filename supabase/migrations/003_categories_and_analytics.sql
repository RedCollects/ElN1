create table if not exists public.site_visits (
  session_id uuid not null,
  visit_date date not null,
  created_at timestamptz not null default now(),
  primary key (session_id, visit_date)
);

create table if not exists public.online_sessions (
  session_id uuid primary key,
  last_seen_at timestamptz not null default now()
);

create table if not exists public.business_clicks (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists business_clicks_business_created_idx
  on public.business_clicks (business_id, created_at desc);

create index if not exists online_sessions_last_seen_idx
  on public.online_sessions (last_seen_at);

alter table public.site_visits enable row level security;
alter table public.online_sessions enable row level security;
alter table public.business_clicks enable row level security;

drop policy if exists "Public cannot access site visits" on public.site_visits;
create policy "Public cannot access site visits"
  on public.site_visits for all to anon, authenticated using (false) with check (false);

drop policy if exists "Public cannot access online sessions" on public.online_sessions;
create policy "Public cannot access online sessions"
  on public.online_sessions for all to anon, authenticated using (false) with check (false);

drop policy if exists "Public cannot access business clicks" on public.business_clicks;
create policy "Public cannot access business clicks"
  on public.business_clicks for all to anon, authenticated using (false) with check (false);

create or replace view public.business_click_totals as
select business_id, count(*)::integer as visits
from public.business_clicks
group by business_id;

create or replace view public.business_daily_click_totals as
select business_id, count(*)::integer as visits
from public.business_clicks
where (created_at at time zone 'America/Mexico_City')::date =
  (now() at time zone 'America/Mexico_City')::date
group by business_id;
