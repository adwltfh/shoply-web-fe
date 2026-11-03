-- Shoply shared backend — tenancy foundation.
-- Stores, staff memberships, profiles and pickup (origin) addresses.
--
-- Conventions used by every Shoply migration:
--   * Money is integer IDR (bigint), weights integer grams, dimensions numeric cm.
--   * All timestamps are timestamptz (stored UTC).
--   * Every exposed table has RLS enabled and explicit grants; Supabase's default
--     "grant all to anon/authenticated" is revoked so nothing is public by accident.
--   * Privileged writes go through SECURITY DEFINER functions that re-check
--     auth.uid() and store membership. Helper functions live in the unexposed
--     `private` schema.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
-- New functions are not executable by PUBLIC unless granted explicitly.
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Returns NULL instead of raising for malformed UUID text (used by storage policies).
create or replace function private.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Create a profile row for every new auth user. This grants NO store access.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  timezone text not null default 'Asia/Jakarta' check (char_length(timezone) <= 64),
  -- DEMO by default. Switching to live is a deliberate, owner-approved,
  -- service-role-only operation (no client UPDATE privilege on this column).
  mode text not null default 'demo' check (mode in ('demo', 'live')),
  currency text not null default 'IDR' check (currency = 'IDR'),
  whatsapp_phone_e164 text check (whatsapp_phone_e164 is null or whatsapp_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- store_members — provisioned by service role only (no self-signup to owner)
-- ---------------------------------------------------------------------------

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  joined_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index store_members_user_idx on public.store_members (user_id) where status = 'active';

-- Membership predicates. SECURITY DEFINER so RLS policies can call them without
-- recursing into store_members' own policies.
create or replace function private.has_store_role(p_store_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function private.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_store_role(p_store_id, array['owner', 'manager', 'staff']);
$$;

-- Owner + manager may manage catalog, pickup addresses and campaigns.
create or replace function private.can_manage_catalog(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_store_role(p_store_id, array['owner', 'manager']);
$$;

-- Raises a FORBIDDEN error unless the caller may manage the store's catalog.
create or replace function private.assert_can_manage_catalog(p_store_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;
  if p_store_id is null or not private.can_manage_catalog(p_store_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
end;
$$;

revoke all on all functions in schema private from public;
grant execute on function
  private.has_store_role(uuid, text[]),
  private.is_store_member(uuid),
  private.can_manage_catalog(uuid),
  private.try_uuid(text)
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- pickup_addresses (shipment origins). Street/phone are seller-only.
-- ---------------------------------------------------------------------------

create table public.pickup_addresses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  label text not null check (char_length(label) between 2 and 80),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{8,20}$'),
  province text not null check (char_length(province) between 2 and 80),
  city text not null check (char_length(city) between 2 and 80),
  district text check (district is null or char_length(district) <= 80),
  province_code text check (province_code is null or char_length(province_code) <= 32),
  city_code text check (city_code is null or char_length(city_code) <= 32),
  district_code text check (district_code is null or char_length(district_code) <= 32),
  provider_location_code text check (provider_location_code is null or char_length(provider_location_code) <= 64),
  street_address text not null check (char_length(street_address) between 5 and 300),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  notes text check (notes is null or char_length(notes) <= 500),
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  check (not (is_default and not active))
);

create unique index pickup_addresses_one_default_per_store
  on public.pickup_addresses (store_id) where is_default;

create trigger pickup_addresses_touch_updated_at
  before update on public.pickup_addresses
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.pickup_addresses enable row level security;

revoke all on public.profiles, public.stores, public.store_members, public.pickup_addresses
  from anon, authenticated;

-- profiles: a user reads/updates only their own profile.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- stores: members read; owners update a safe subset of columns (never `mode`).
grant select on public.stores to authenticated;
grant update (name, timezone, whatsapp_phone_e164) on public.stores to authenticated;
create policy stores_select_member on public.stores
  for select to authenticated using (private.is_store_member(id));
create policy stores_update_owner on public.stores
  for update to authenticated
  using (private.has_store_role(id, array['owner']))
  with check (private.has_store_role(id, array['owner']));

-- store_members: users see their own memberships; owners see their store's team.
-- No INSERT/UPDATE/DELETE grants: membership is provisioned with the service role.
grant select on public.store_members to authenticated;
create policy store_members_select on public.store_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.has_store_role(store_id, array['owner']));

-- pickup_addresses: members read; writes go through seller_* functions below.
grant select on public.pickup_addresses to authenticated;
create policy pickup_addresses_select_member on public.pickup_addresses
  for select to authenticated using (private.is_store_member(store_id));

-- ---------------------------------------------------------------------------
-- Pickup address mutations (owner/manager)
-- ---------------------------------------------------------------------------

create or replace function public.seller_save_pickup_address(
  p_store_id uuid,
  p_address_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_id uuid;
  v_has_default boolean;
begin
  if p_address_id is null then
    v_store_id := p_store_id;
  else
    select store_id into v_store_id from public.pickup_addresses where id = p_address_id;
    if v_store_id is null then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  perform private.assert_can_manage_catalog(v_store_id);

  if p_address_id is null then
    -- The first address becomes the default; later ones never silently replace it.
    select exists (select 1 from public.pickup_addresses where store_id = v_store_id and is_default)
      into v_has_default;

    insert into public.pickup_addresses (
      store_id, label, contact_name, phone, province, city, district,
      province_code, city_code, district_code, provider_location_code,
      street_address, postal_code, notes, is_default
    ) values (
      v_store_id,
      p_payload ->> 'label',
      p_payload ->> 'contact_name',
      p_payload ->> 'phone',
      p_payload ->> 'province',
      p_payload ->> 'city',
      nullif(p_payload ->> 'district', ''),
      nullif(p_payload ->> 'province_code', ''),
      nullif(p_payload ->> 'city_code', ''),
      nullif(p_payload ->> 'district_code', ''),
      nullif(p_payload ->> 'provider_location_code', ''),
      p_payload ->> 'street_address',
      nullif(p_payload ->> 'postal_code', ''),
      nullif(p_payload ->> 'notes', ''),
      not v_has_default
    )
    returning id into v_id;
  else
    update public.pickup_addresses set
      label = p_payload ->> 'label',
      contact_name = p_payload ->> 'contact_name',
      phone = p_payload ->> 'phone',
      province = p_payload ->> 'province',
      city = p_payload ->> 'city',
      district = nullif(p_payload ->> 'district', ''),
      province_code = nullif(p_payload ->> 'province_code', ''),
      city_code = nullif(p_payload ->> 'city_code', ''),
      district_code = nullif(p_payload ->> 'district_code', ''),
      provider_location_code = nullif(p_payload ->> 'provider_location_code', ''),
      street_address = p_payload ->> 'street_address',
      postal_code = nullif(p_payload ->> 'postal_code', ''),
      notes = nullif(p_payload ->> 'notes', '')
    where id = p_address_id
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.seller_set_default_pickup_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_active boolean;
begin
  select store_id, active into v_store_id, v_active
  from public.pickup_addresses where id = p_address_id;
  if v_store_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_store_id);
  if not v_active then
    raise exception 'VALIDATION_ERROR: inactive address cannot be the default' using errcode = '22023';
  end if;

  update public.pickup_addresses set is_default = false
  where store_id = v_store_id and is_default and id <> p_address_id;
  update public.pickup_addresses set is_default = true where id = p_address_id;
end;
$$;

create or replace function public.seller_set_pickup_address_active(p_address_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_is_default boolean;
begin
  select store_id, is_default into v_store_id, v_is_default
  from public.pickup_addresses where id = p_address_id;
  if v_store_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_store_id);
  if not p_active and v_is_default then
    raise exception 'VALIDATION_ERROR: choose another default address before deactivating this one' using errcode = '22023';
  end if;
  update public.pickup_addresses set active = p_active where id = p_address_id;
end;
$$;

revoke all on function
  public.seller_save_pickup_address(uuid, uuid, jsonb),
  public.seller_set_default_pickup_address(uuid),
  public.seller_set_pickup_address_active(uuid, boolean)
from public, anon;
grant execute on function
  public.seller_save_pickup_address(uuid, uuid, jsonb),
  public.seller_set_default_pickup_address(uuid),
  public.seller_set_pickup_address_active(uuid, boolean)
to authenticated;
