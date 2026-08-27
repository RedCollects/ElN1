alter table public.bids
  add column if not exists failure_reason text;

update public.businesses
set active = false, position = null
where active = true
  and position > 50;

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

  if selected_bid.status <> 'pending' then
    raise exception 'La oferta no está pendiente de pago';
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
