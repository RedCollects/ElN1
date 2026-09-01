-- Metodo A: el ranking se ordena por la ultima oferta pagada (SPEC-METODO-A
-- con dos ajustes del 2026-08-31: minimo de entrada $100 y toda oferta debe
-- ser al menos 10% mayor que el precio mas bajo del ranking, validado en el
-- checkout). Sustituye al modelo secuencial de la 009 (aplicada en prod, no
-- se edita).
--
--   * Precio del negocio = monto de su ultima oferta pagada (reemplaza).
--   * Ranking = orden por precio desc; empate: el que llego primero arriba.
--   * Reembolsos al confirmar un pago tardio: entrada que ya no supera al
--     #50 con ranking lleno, monto <= precio propio estando dentro, negocio
--     desactivado por el admin, u oferta legada sin negocio ligado. Todo lo
--     demas cuenta donde caiga.

-- Momento en que el negocio alcanzo su precio actual (desempate del orden).
alter table public.businesses
  add column if not exists price_set_at timestamptz;

-- Backfill preservando el orden actual: a mejor posicion, marca mas antigua.
update public.businesses
set price_set_at = now() - (interval '1 second' * (100 - coalesce(position, 60)))
where price_set_at is null;

-- Reordena TODO el ranking segun la definicion del Metodo A y compacta:
-- top 50 por (precio desc, antiguedad asc); el resto queda sin posicion.
-- Dos pasos (+1000) para no chocar con el indice unico de position.
create or replace function public.reorder_ranking()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.businesses
  set position = null
  where position is not null
    and not (active and status = 'published' and coalesce(current_price, 0) > 0);

  with ordered as (
    select id,
           row_number() over (
             order by current_price desc, price_set_at asc nulls last, created_at asc, id
           ) as rn
    from public.businesses
    where active and status = 'published' and coalesce(current_price, 0) > 0
  )
  update public.businesses b
  set position = ordered.rn + 1000
  from ordered
  where b.id = ordered.id;

  update public.businesses
  set position = position - 1000
  where position > 1000 and position <= 1050;

  update public.businesses
  set position = null
  where position > 1000;
end;
$$;

revoke all on function public.reorder_ranking() from public;
grant execute on function public.reorder_ranking() to service_role;

-- Estado que necesita el checkout para calcular la oferta minima y la
-- posicion proyectada. Sustituye a position_state (que queda sin uso).
create or replace function public.ranking_state(p_business_id uuid default null)
returns table (
  lowest_price numeric,
  ranked_count integer,
  own_price numeric,
  own_position integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select min(b.current_price) from public.businesses b
      where b.active and b.status = 'published' and b.position between 1 and 50),
    (select count(*)::integer from public.businesses b
      where b.active and b.status = 'published' and b.position between 1 and 50),
    (select b.current_price from public.businesses b where b.id = p_business_id),
    (select b.position from public.businesses b where b.id = p_business_id);
$$;

revoke all on function public.ranking_state(uuid) from public;
grant execute on function public.ranking_state(uuid) to service_role;

-- Asignacion al confirmarse un pago, Metodo A: el dinero siempre cuenta
-- salvo los 2 casos de reembolso. Sin posiciones objetivo: se fija el precio
-- y se reordena.
create or replace function public.settle_bid(p_bid_id text, p_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ranking_size constant integer := 50;
  selected_bid public.bids%rowtype;
  bidder public.businesses%rowtype;
  old_position integer;
  ranked_count integer;
  last_price numeric;
  lowest_price numeric;
  new_position integer;
begin
  perform pg_advisory_xact_lock(hashtext('eln1_ranking'));

  select * into selected_bid
  from public.bids
  where id::text = p_bid_id
  for update;

  if not found then
    raise exception 'Oferta no encontrada';
  end if;

  if selected_bid.status = 'paid' then
    return jsonb_build_object('success', true, 'already_paid', true, 'bid_id', selected_bid.id);
  end if;

  if selected_bid.business_id is not null then
    select * into bidder
    from public.businesses
    where id = selected_bid.business_id
    for update;

    if not found then
      raise exception 'Negocio de la oferta no encontrado';
    end if;
  end if;

  select count(*), min(current_price) filter (where position = ranking_size), min(current_price)
  into ranked_count, last_price, lowest_price
  from public.businesses
  where active and status = 'published' and position between 1 and ranking_size;

  old_position := bidder.position;

  -- Reembolso (c): el admin desactivo el negocio mientras el pago estaba en
  -- curso. Sin esto se cobraria sin dar posicion.
  if bidder.id is not null and not bidder.active then
    update public.bids
    set status = 'outbid', payment_id = p_payment_id, failure_reason = 'negocio_desactivado'
    where id = selected_bid.id;

    return jsonb_build_object(
      'success', false,
      'reason', 'outbid',
      'required', null,
      'paid', selected_bid.amount,
      'bid_id', selected_bid.id
    );
  end if;

  -- Reembolso (a): estando dentro, un monto que no mejora el precio propio.
  if bidder.id is not null and bidder.position is not null
     and selected_bid.amount <= bidder.current_price then
    update public.bids
    set status = 'outbid', payment_id = p_payment_id, failure_reason = 'monto_no_mejora'
    where id = selected_bid.id;

    return jsonb_build_object(
      'success', false,
      'reason', 'outbid',
      'required', greatest(bidder.current_price + 1, ceil(coalesce(lowest_price, 0) * 1.1), 100),
      'paid', selected_bid.amount,
      'bid_id', selected_bid.id
    );
  end if;

  -- Reembolso (b): entrada con el ranking lleno que ya no supera al #50.
  if (bidder.id is null or bidder.position is null)
     and ranked_count >= ranking_size
     and selected_bid.amount <= coalesce(last_price, 0) then
    update public.bids
    set status = 'outbid', payment_id = p_payment_id, failure_reason = 'ranking_lleno'
    where id = selected_bid.id;

    return jsonb_build_object(
      'success', false,
      'reason', 'outbid',
      'required', coalesce(last_price, 0) + 1,
      'paid', selected_bid.amount,
      'bid_id', selected_bid.id
    );
  end if;

  -- Ofertas antiguas sin negocio ligado: ya no existen en produccion (la
  -- base se reconstruyo el 2026-08-27); reembolsar en vez de crear un
  -- negocio fantasma sin perfil.
  if bidder.id is null then
    update public.bids
    set status = 'outbid', payment_id = p_payment_id, failure_reason = 'oferta_legada'
    where id = selected_bid.id;

    return jsonb_build_object(
      'success', false,
      'reason', 'outbid',
      'required', null,
      'paid', selected_bid.amount,
      'bid_id', selected_bid.id
    );
  end if;

  update public.businesses
  set current_price = selected_bid.amount,
      price_set_at = clock_timestamp(),
      status = 'published'
  where id = bidder.id;

  perform public.reorder_ranking();

  update public.bids
  set status = 'paid', payment_id = p_payment_id, settled_at = now()
  where id = selected_bid.id;

  -- Las demas reservas de ese negocio ya no tienen sentido.
  update public.bids
  set status = 'expired', failure_reason = 'sustituida_por_pago'
  where business_id = bidder.id and status = 'pending' and id <> selected_bid.id;

  select position into new_position from public.businesses where id = bidder.id;

  return jsonb_build_object(
    'success', true,
    'business_id', bidder.id,
    'bid_id', selected_bid.id,
    'position', new_position,
    'shifted', new_position is distinct from old_position,
    'moved_from', old_position
  );
end;
$$;

revoke all on function public.settle_bid(text, text) from public;
grant execute on function public.settle_bid(text, text) to service_role;

-- Datos existentes: el orden pasa a ser el del Metodo A (los precios
-- actuales ya son montos pagados; el backfill de price_set_at conserva el
-- orden relativo de hoy en los empates).
select public.reorder_ranking();
