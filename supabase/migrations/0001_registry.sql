create extension if not exists "pgcrypto";

create table if not exists public.registry_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purchase_url text not null,
  desired_quantity integer not null check (desired_quantity > 0),
  image_url text,
  notes text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  manual_price numeric(10,2),
  display_price text,
  price_amount numeric(10,2),
  price_currency text,
  price_status text not null default 'not_checked' check (price_status in ('success', 'failed', 'not_checked')),
  price_source text,
  price_fetched_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.registry_reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.registry_items(id) on delete cascade,
  guest_name text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists registry_items_set_timestamp on public.registry_items;
create trigger registry_items_set_timestamp
before update on public.registry_items
for each row
execute function public.set_timestamp();

create or replace function public.reserve_registry_item(
  p_item_id uuid,
  p_guest_name text,
  p_quantity integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_desired integer;
  v_reserved integer;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select desired_quantity
  into v_desired
  from public.registry_items
  where id = p_item_id and is_active = true
  for update;

  if v_desired is null then
    raise exception 'Item not found';
  end if;

  select coalesce(sum(quantity), 0)
  into v_reserved
  from public.registry_reservations
  where item_id = p_item_id;

  if v_reserved + p_quantity > v_desired then
    raise exception 'Not enough quantity remaining';
  end if;

  insert into public.registry_reservations (item_id, guest_name, quantity)
  values (p_item_id, p_guest_name, p_quantity);
end;
$$;

alter table public.registry_items enable row level security;
alter table public.registry_reservations enable row level security;

create policy "Public can read active registry items"
on public.registry_items
for select
using (is_active = true);

create policy "Public can read reservations"
on public.registry_reservations
for select
using (true);

create policy "Public can insert reservations"
on public.registry_reservations
for insert
with check (true);

grant execute on function public.reserve_registry_item(uuid, text, integer) to anon, authenticated;
