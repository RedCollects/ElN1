-- Bucket público para logos y portadas de negocios.
-- Las subidas pasan por el servidor (service_role) tras validar propiedad,
-- tipo y tamaño; el público solo necesita leer.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  4194304, -- 4 MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- updated_at en cualquier cambio (no solo al renombrar), para que el panel
-- detecte cuándo refrescar su estado.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists businesses_touch_updated_at on public.businesses;
create trigger businesses_touch_updated_at
  before update on public.businesses
  for each row execute function public.touch_updated_at();

drop policy if exists "Public can read business media" on storage.objects;
create policy "Public can read business media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'business-media');
