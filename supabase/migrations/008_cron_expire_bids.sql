-- Caduca las reservas vencidas cada 5 minutos con pg_cron.
--
-- Hasta ahora `expire_bids()` solo se ejecutaba al iniciar un checkout, así
-- que una reserva vencida podía seguir marcada como `pending` (y contar como
-- piso de precio en `position_state`) hasta que alguien intentara ofertar.

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;

-- `cron.schedule` con nombre reemplaza el trabajo si ya existe.
select cron.schedule(
  'expire-bids',
  '*/5 * * * *',
  $$select public.expire_bids();$$
);
