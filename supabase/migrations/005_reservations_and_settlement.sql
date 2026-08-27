-- Entrega C: ofertas ligadas al negocio, reservas con caducidad y una
-- asignación de posiciones que revalida el precio y serializa por cerrojo.

alter table public.bids
  add column if not exists expires_at timestamptz,
  add column if not exists settled_at timestamptz,
  add column if not exists refund_id text,
  add column if not exists failure_reason text;

alter table public.bids
  drop constraint if exists bids_status_check;
alter table public.bids
  add constraint bids_status_check
  check (status in ('pending', 'paid', 'rejected', 'expired', 'outbid', 'refunded'));

create index if not exists bids_active_reservations_idx
  on public.bids (position, expires_at)
  where status = 'pending';

create index if not exists bids_business_idx
  on public.bids (business_id);

-- Marca como caducadas las reservas pendientes vencidas.
create or replace function public.expire_bids()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.bids
  set status = 'expired', failure_reason = 'reserva_caducada'
  where status = 'pending'
    and expires_at is not null
    and expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Estado de una posición para calcular la oferta mínima: precio del negocio
-- que la ocupa y la reserva pendiente más alta (vigente).
create or replace function public.position_state(p_position integer)
returns table (
  holder_id uuid,
  current_price numeric,
  reserved_amount numeric,
  reserved_until timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select b.id from public.businesses b
      where b.active and b.status = 'published' and b.position = p_position
      limit 1),
    (select b.current_price from public.businesses b
      where b.active and b.status = 'published' and b.position = p_position
      limit 1),
    (select max(r.amount) from public.bids r
      where r.status = 'pending' and r.position = p_position
        and r.expires_at is not null and r.expires_at > now()),
    (select max(r.expires_at) from public.bids r
      where r.status = 'pending' and r.position = p_position
        and r.expires_at is not null and r.expires_at > now()
        and r.amount = (select max(x.amount) from public.bids x
          where x.status = 'pending' and x.position = p_position
            and x.expires_at is not null and x.expires_at > now()));
$$;

-- Reservas vigentes para mostrarlas en el ranking (sin datos personales).
create or replace function public.active_reservations()
returns table (
  ranking_position integer,
  amount numeric,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (r.position) r.position as ranking_position, r.amount, r.expires_at
  from public.bids r
  where r.status = 'pending'
    and r.expires_at is not null
    and r.expires_at > now()
  order by r.position, r.amount desc, r.expires_at desc;
$$;

revoke all on function public.expire_bids() from public;
revoke all on function public.position_state(integer) from public;
revoke all on function public.active_reservations() from public;
grant execute on function public.expire_bids() to service_role;
grant execute on function public.position_state(integer) to service_role;
grant execute on function public.active_reservations() to service_role;

-- Asignación de posición al confirmarse un pago.
--
-- * Cerrojo global (advisory lock) para que dos confirmaciones nunca se
--   procesen a la vez.
-- * Revalida: si el importe ya no alcanza frente al precio real de la
--   posición, no asigna y devuelve success=false, reason='outbid'.
-- * Si el negocio ya está en el ranking, lo MUEVE (los que quedan entre la
--   posición nueva y la vieja bajan uno); si compra su propia posición solo
--   sube su precio (blindaje).
-- * Quien cae fuera del top 10 queda con position = null (sigue publicado).
create or replace function public.settle_bid(p_bid_id text, p_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ranking_size constant integer := 10;
  outbid_factor constant numeric := 1.1;
  selected_bid public.bids%rowtype;
  target integer;
  holder public.businesses%rowtype;
  bidder public.businesses%rowtype;
  required numeric;
  old_position integer;
  shifted boolean := false;
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

  target := selected_bid.position;

  select * into holder
  from public.businesses
  where active and status = 'published' and position = target
  for update;

  if selected_bid.business_id is not null then
    select * into bidder
    from public.businesses
    where id = selected_bid.business_id
    for update;

    if not found then
      raise exception 'Negocio de la oferta no encontrado';
    end if;
  end if;

  -- Precio exigido en este instante (no cuenta reservas: solo lo publicado).
  if holder.id is not null then
    required := ceil(holder.current_price * outbid_factor);
  else
    required := selected_bid.amount; -- posición libre: cualquier importe pagado vale
  end if;

  if selected_bid.amount < required then
    update public.bids
    set status = 'outbid', payment_id = p_payment_id, failure_reason = 'superada_antes_de_confirmar'
    where id = selected_bid.id;

    return jsonb_build_object(
      'success', false,
      'reason', 'outbid',
      'required', required,
      'paid', selected_bid.amount,
      'bid_id', selected_bid.id
    );
  end if;

  if bidder.id is not null then
    old_position := bidder.position;

    if old_position = target then
      -- Blindaje: solo sube el precio.
      update public.businesses
      set current_price = selected_bid.amount
      where id = bidder.id;
    else
      -- 1) Apartar a los que bajan un lugar (rango [target, old_position) si
      --    el negocio sube desde más abajo; [target, ∞) si entra de fuera).
      if holder.id is not null then
        if old_position is not null and old_position > target then
          update public.businesses
          set position = position + 1000
          where active and status = 'published'
            and position >= target and position < old_position;
        else
          update public.businesses
          set position = position + 1000
          where active and status = 'published'
            and position >= target;
        end if;
      end if;

      -- 2) Colocar al negocio en su destino (ya libre) y liberar su posición vieja.
      update public.businesses
      set position = target,
          current_price = selected_bid.amount,
          status = 'published'
      where id = bidder.id;

      -- 3) Bajar un lugar a los apartados.
      if holder.id is not null then
        update public.businesses
        set position = position - 999
        where active and status = 'published' and position >= 1000;

        shifted := true;
      end if;
    end if;
  else
    -- Oferta antigua sin negocio ligado: se crea el negocio (compatibilidad).
    if holder.id is not null then
      update public.businesses
      set position = position + 1000
      where active and status = 'published' and position >= target;

      update public.businesses
      set position = position - 999
      where active and status = 'published' and position >= 1000;

      shifted := true;
    end if;

    insert into public.businesses (name, category, current_price, position, active, status)
    values (selected_bid.business_name, coalesce(selected_bid.category, 'General'), selected_bid.amount, target, true, 'published')
    returning * into bidder;
  end if;

  -- Quien cae fuera del ranking conserva su perfil, sin posición.
  update public.businesses
  set position = null
  where active and status = 'published' and position > ranking_size;

  update public.bids
  set status = 'paid', payment_id = p_payment_id, settled_at = now()
  where id = selected_bid.id;

  -- Las demás reservas de ese negocio ya no tienen sentido.
  update public.bids
  set status = 'expired', failure_reason = 'sustituida_por_pago'
  where business_id = bidder.id and status = 'pending' and id <> selected_bid.id;

  return jsonb_build_object(
    'success', true,
    'business_id', bidder.id,
    'bid_id', selected_bid.id,
    'position', target,
    'shifted', shifted,
    'moved_from', old_position
  );
end;
$$;

revoke all on function public.settle_bid(text, text) from public;
grant execute on function public.settle_bid(text, text) to service_role;
