-- Evidencia de aceptación de los Términos y condiciones.
--
-- * businesses.terms_accepted_at / terms_version: cuándo y qué versión aceptó
--   el dueño al crear la cuenta (la casilla del registro viaja en los metadatos
--   del usuario de Supabase Auth y el trigger la copia aquí).
-- * bids.terms_version: versión vigente cuando se reservó cada posición, para
--   dejar constancia por operación.

alter table public.businesses
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

alter table public.bids
  add column if not exists terms_version text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_version text := nullif(trim(new.raw_user_meta_data ->> 'terms_version'), '');
begin
  insert into public.businesses (
    owner_id, name, status, active, current_price, terms_version, terms_accepted_at
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''), 'Mi negocio'),
    'draft',
    true,
    0,
    accepted_version,
    case when accepted_version is null then null else now() end
  );
  return new;
end;
$$;
