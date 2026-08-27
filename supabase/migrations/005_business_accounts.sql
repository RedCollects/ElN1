-- Cuentas de negocio: cada negocio pertenece a un usuario de Supabase Auth,
-- nace como borrador y solo se vuelve público al publicarse (pagar).

create extension if not exists "unaccent";

alter table public.businesses
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'draft',
  add column if not exists slug text,
  add column if not exists city text,
  add column if not exists tagline text,
  add column if not exists email_public text,
  add column if not exists website text,
  add column if not exists cover_url text,
  add column if not exists maps_url text,
  add column if not exists hours text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.businesses
  drop constraint if exists businesses_status_check;
alter table public.businesses
  add constraint businesses_status_check check (status in ('draft', 'published'));

-- Los negocios que ya existían (creados por settle_bid antes de esta migración)
-- ya pagaron: quedan publicados.
update public.businesses
set status = 'published'
where status = 'draft' and position is not null;

create unique index if not exists businesses_slug_unique
  on public.businesses (slug)
  where slug is not null;

-- Por ahora, un negocio por cuenta.
create unique index if not exists businesses_owner_unique
  on public.businesses (owner_id)
  where owner_id is not null;

-- Slug legible y único a partir del nombre (tacos-dona-lupita, tacos-dona-lupita-2, ...).
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_business_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  if tg_op = 'UPDATE' and new.name is not distinct from old.name and new.slug is not null then
    return new;
  end if;

  base_slug := nullif(public.slugify(new.name), '');

  if base_slug is null then
    base_slug := 'negocio';
  end if;

  candidate := base_slug;

  while exists (
    select 1 from public.businesses
    where slug = candidate and id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists businesses_set_slug on public.businesses;
create trigger businesses_set_slug
  before insert or update of name on public.businesses
  for each row execute function public.set_business_slug();

-- Slugs para los negocios existentes.
update public.businesses set name = name where slug is null;

-- Al registrarse un usuario se crea su negocio en borrador con el nombre
-- que escribió en el formulario (viaja en los metadatos del registro).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (owner_id, name, status, active, current_price)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''), 'Mi negocio'),
    'draft',
    true,
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Políticas: el público solo ve negocios publicados y activos; cada dueño
-- puede leer el suyo. Las escrituras siguen pasando solo por el servidor
-- (service_role) tras verificar la propiedad.
drop policy if exists "Public can view active businesses" on public.businesses;
create policy "Public can view published businesses"
  on public.businesses for select
  to anon, authenticated
  using (active = true and status = 'published');

drop policy if exists "Owners can view own business" on public.businesses;
create policy "Owners can view own business"
  on public.businesses for select
  to authenticated
  using (owner_id = (select auth.uid()));
