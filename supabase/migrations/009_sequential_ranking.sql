-- Ranking secuencial (PLAN-RANKING.md):
--   * Solo se vende el siguiente lugar libre (max + 1) o superar a un ocupado.
--   * Superar cuesta ceil(1.1 x maximo pagado desde esa posicion hacia abajo).
--   * Nunca hay huecos: tras cada asignacion se compacta el ranking.
--   * Cambios en `businesses` se publican por Realtime para el ranking en vivo.

-- Una oferta de ENTRADA (el lugar estaba libre al reservar) entra al final
-- del ranking aunque otro haya entrado antes; no compite por el numero.
alter table public.bids
  add column if not exists entry boolean not null default false;

-- Compacta las posiciones 1..N sin huecos, respetando el orden actual.
-- Dos pasos (+1000 y luego -1000) para no chocar con el indice unico.
create or replace function public.compact_ranking()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select id, row_number() over (order by position) as rn
    from public.businesses
    where active and status = 'published' and position is not null
  )
  update public.businesses b
  set position = ranked.rn + 1000
  from ranked
  where b.id = ranked.id;

  update public.businesses
  set position = position - 1000
  where active and status = 'published' and position > 1000;
end;
$$;

revoke all on function public.compact_ranking() from public;
grant execute on function public.compact_ranking() to service_role;

-- Estado de una posicion para calcular la oferta minima.
--   floor_price: maximo pagado desde la posicion hacia abajo (sin contar al
--     negocio p_business_id, que es quien pregunta y puede estar subiendo).
--   next_free_position: el unico lugar libre que se vende (null si esta lleno).
drop function if exists public.position_state(integer);

create or replace function public.position_state(p_position integer, p_business_id uuid default null)
returns table (
  holder_id uuid,
  current_price numeric,
  floor_price numeric,
  reserved_amount numeric,
  reserved_until timestamptz,
  next_free_position integer
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
    (select max(b.current_price) from public.businesses b
      where b.active and b.status = 'published'
        and b.position >= p_position and b.position <= 50
        and (p_business_id is null or b.id <> p_business_id)),
    (select max(r.amount) from public.bids r
      where r.status = 'pending' and r.position = p_position
        and r.expires_at is not null and r.expires_at > now()),
    (select max(r.expires_at) from public.bids r
      where r.status = 'pending' and r.position = p_position
        and r.expires_at is not null and r.expires_at > now()
        and r.amount = (select max(x.amount) from public.bids x
          where x.status = 'pending' and x.position = p_position
            and x.expires_at is not null and x.expires_at > now())),
    (select case when coalesce(max(b.position), 0) >= 50 then null
                 else coalesce(max(b.position), 0) + 1 end
      from public.businesses b
      where b.active and b.status = 'published' and b.position between 1 and 50);
$$;

revoke all on function public.position_state(integer, uuid) from public;
grant execute on function public.position_state(integer, uuid) to service_role;

-- Asignacion de posicion al confirmarse un pago (ver 007 para el contexto).
-- Novedades: entrada solo al siguiente lugar libre, precio exigido = maximo
-- hacia abajo, y compactacion al final para que nunca queden huecos.
create or replace function public.settle_bid(p_bid_id text, p_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ranking_size constant integer := 50;
  outbid_factor constant numeric := 1.1;
  selected_bid public.bids%rowtype;
  target integer;
  holder public.businesses%rowtype;
  bidder public.businesses%rowtype;
  required numeric;
  old_position integer;
  max_position integer;
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

  select coalesce(max(position), 0) into max_position
  from public.businesses
  where active and status = 'published' and position between 1 and ranking_size;

  if selected_bid.business_id is not null then
    select * into bidder
    from public.businesses
    where id = selected_bid.business_id
    for update;

    if not found then
      raise exception 'Negocio de la oferta no encontrado';
    end if;
  end if;

  if not selected_bid.entry then
    select * into holder
    from public.businesses
    where active and status = 'published' and position = target
    for update;
  end if;

  if holder.id is null then
    -- Lugar libre: es una ENTRADA al ranking. Solo existe "el siguiente
    -- lugar", asi que se entra al final aunque el numero reservado ya no
    -- coincida (alguien entro antes).
    if bidder.id is not null and bidder.position is not null then
      -- Ya esta en el ranking: un lugar libre siempre es peor; solo blinda.
      -- (Tambien cubre una oferta vieja por un numero peor que el actual.)
      update public.businesses
      set current_price = greatest(current_price, selected_bid.amount)
      where id = bidder.id;

      update public.bids
      set status = 'paid', payment_id = p_payment_id, settled_at = now()
      where id = selected_bid.id;

      return jsonb_build_object(
        'success', true,
        'business_id', bidder.id,
        'bid_id', selected_bid.id,
        'position', bidder.position,
        'shifted', false,
        'moved_from', bidder.position
      );
    end if;

    if max_position >= ranking_size then
      update public.bids
      set status = 'outbid', payment_id = p_payment_id, failure_reason = 'ranking_lleno'
      where id = selected_bid.id;

      return jsonb_build_object(
        'success', false,
        'reason', 'outbid',
        'required', null,
        'paid', selected_bid.amount,
        'bid_id', selected_bid.id
      );
    end if;

    target := max_position + 1;
    required := selected_bid.amount;
  else
    -- Ocupada: 110 % del maximo pagado desde esa posicion hacia abajo, sin
    -- contar al propio negocio si es el quien sube.
    select ceil(max(current_price) * outbid_factor) into required
    from public.businesses
    where active and status = 'published'
      and position >= target and position <= ranking_size
      and (bidder.id is null or id <> bidder.id);

    if required is null then
      required := ceil(holder.current_price * outbid_factor);
    end if;
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

    if old_position is not null and target >= old_position then
      -- Su posicion actual ya es igual o mejor: solo sube su precio (blindaje).
      target := old_position;
      update public.businesses
      set current_price = greatest(current_price, selected_bid.amount)
      where id = bidder.id;
    elsif old_position = target then
      -- Blindaje: solo sube el precio.
      update public.businesses
      set current_price = selected_bid.amount
      where id = bidder.id;
    else
      -- 1) Apartar a los que bajan un lugar.
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

      -- 2) Colocar al negocio en su destino.
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

  -- Sin huecos (por ejemplo, el lugar que dejo un negocio al subir).
  perform public.compact_ranking();

  -- Quien cae fuera del ranking conserva su perfil, sin posicion.
  update public.businesses
  set position = null
  where active and status = 'published' and position > ranking_size;

  update public.bids
  set status = 'paid', payment_id = p_payment_id, settled_at = now()
  where id = selected_bid.id;

  -- Las demas reservas de ese negocio ya no tienen sentido.
  update public.bids
  set status = 'expired', failure_reason = 'sustituida_por_pago'
  where business_id = bidder.id and status = 'pending' and id <> selected_bid.id;

  select position into target from public.businesses where id = bidder.id;

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

-- Datos existentes: cerrar huecos una sola vez.
select public.compact_ranking();

-- Ranking en vivo: publicar cambios de `businesses` (RLS sigue aplicando:
-- el publico solo recibe negocios publicados y activos).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'businesses'
     ) then
    alter publication supabase_realtime add table public.businesses;
  end if;
end;
$$;
