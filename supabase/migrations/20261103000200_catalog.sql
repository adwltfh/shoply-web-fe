-- Shoply shared backend — catalog, physical specs, variants, inventory, media.
--
-- Write path: seller_* SECURITY DEFINER functions only. They re-check the
-- caller's store role, keep multi-table edits atomic, and enforce publish rules
-- so a client cannot activate an incomplete product with a direct table update.
-- Read path: sellers read their store's rows via RLS; buyers (anon) read only the
-- storefront_* views, which apply the server-time visibility predicate.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id)
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  category_id uuid,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 180),
  title text not null check (char_length(title) between 3 and 160 and title !~ '[<>]'),
  short_description text check (short_description is null or char_length(short_description) <= 280),
  description text check (description is null or char_length(description) <= 10000),
  brand text check (brand is null or char_length(brand) <= 80),
  material text check (material is null or char_length(material) <= 200),
  color text check (color is null or char_length(color) <= 60),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  product_type text not null default 'physical' check (product_type = 'physical'),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'paused', 'archived')),
  base_price_idr bigint not null default 0 check (base_price_idr >= 0 and base_price_idr <= 1000000000),
  compare_at_price_idr bigint check (compare_at_price_idr is null or compare_at_price_idr > 0),
  max_qty_per_order int check (max_qty_per_order is null or max_qty_per_order between 1 and 999),
  track_inventory boolean not null default true,
  published_at timestamptz,            -- first successful publish; locks the slug
  publish_at timestamptz,
  unpublish_at timestamptz,
  pickup_address_id uuid,              -- null = use the store's default pickup address
  seo_title text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description text check (seo_description is null or char_length(seo_description) <= 320),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id),
  foreign key (store_id, category_id) references public.categories (store_id, id) on delete restrict,
  foreign key (store_id, pickup_address_id) references public.pickup_addresses (store_id, id) on delete restrict,
  check (unpublish_at is null or publish_at is null or unpublish_at > publish_at)
);

create index products_store_visibility_idx
  on public.products (store_id, status, publish_at, unpublish_at);
create index products_store_updated_idx on public.products (store_id, updated_at desc);

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function private.touch_updated_at();

-- Physical/logistics data. Nullable while drafting; publish requires > 0 values.
create table public.product_physical_specs (
  product_id uuid primary key references public.products (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete restrict,
  weight_grams int check (weight_grams is null or weight_grams between 1 and 500000),
  length_cm numeric(8, 2) check (length_cm is null or length_cm > 0),
  width_cm numeric(8, 2) check (width_cm is null or width_cm > 0),
  height_cm numeric(8, 2) check (height_cm is null or height_cm > 0),
  packaging_weight_grams int not null default 0 check (packaging_weight_grams between 0 and 100000),
  fragile boolean not null default false,
  liquid boolean not null default false,
  restricted_category text not null default 'none'
    check (restricted_category in ('none', 'lithium_battery', 'flammable', 'aerosol', 'magnetic', 'prohibited')),
  handling_days int not null default 1 check (handling_days between 0 and 60),
  care_instructions text check (care_instructions is null or char_length(care_instructions) <= 2000),
  packaging_notes text check (packaging_notes is null or char_length(packaging_notes) <= 1000), -- seller-only
  updated_at timestamptz not null default now()
);

create trigger product_physical_specs_touch_updated_at
  before update on public.product_physical_specs
  for each row execute function private.touch_updated_at();

-- Every product has >= 1 variant; option-less products get one default variant
-- so inventory and order-item logic stay uniform.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  title text not null default 'Default' check (char_length(title) between 1 and 120),
  sku text check (sku is null or sku ~ '^[A-Za-z0-9._-]{1,64}$'),
  option_values jsonb not null default '{}'::jsonb check (jsonb_typeof(option_values) = 'object'),
  is_default boolean not null default false,
  price_override_idr bigint check (price_override_idr is null or price_override_idr between 0 and 1000000000),
  weight_override_grams int check (weight_override_grams is null or weight_override_grams between 1 and 500000),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_variants_sku_unique_active
  on public.product_variants (store_id, lower(sku)) where active and sku is not null;
create unique index product_variants_options_unique_active
  on public.product_variants (product_id, option_values) where active;
create unique index product_variants_one_default
  on public.product_variants (product_id) where is_default and active;
create index product_variants_product_idx on public.product_variants (product_id);

create trigger product_variants_touch_updated_at
  before update on public.product_variants
  for each row execute function private.touch_updated_at();

create table public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  value text not null check (char_length(value) between 1 and 500),
  unit text check (unit is null or char_length(unit) <= 20),
  is_public boolean not null default true,
  sort_order int not null default 0
);

create index product_attributes_product_idx on public.product_attributes (product_id, sort_order);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  sort_order int not null default 0,
  width_px int check (width_px is null or width_px > 0),
  height_px int check (height_px is null or height_px > 0),
  attribution text check (attribution is null or char_length(attribution) <= 300),
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  variant_id uuid not null unique references public.product_variants (id) on delete restrict,
  on_hand int not null default 0 check (on_hand >= 0),
  reserved int not null default 0 check (reserved >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  check (on_hand >= reserved)
);

create trigger inventory_touch_updated_at
  before update on public.inventory
  for each row execute function private.touch_updated_at();

-- Append-only stock ledger.
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  delta_on_hand int not null default 0,
  delta_reserved int not null default 0,
  reason text not null check (reason in ('initial_stock', 'manual_adjustment', 'order_reserved', 'order_released', 'order_fulfilled')),
  reference_id uuid,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (delta_on_hand <> 0 or delta_reserved <> 0)
);

create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

create or replace function private.reject_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'inventory_movements is append-only';
end;
$$;

create trigger inventory_movements_append_only
  before update or delete on public.inventory_movements
  for each row execute function private.reject_mutation();

-- ---------------------------------------------------------------------------
-- Visibility + publish rules
-- ---------------------------------------------------------------------------

-- Public visibility predicate, evaluated against trusted DB time at read time.
-- Sold-out products stay visible (but not purchasable).
create or replace function private.is_publicly_visible(
  p_status text,
  p_publish_at timestamptz,
  p_unpublish_at timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status in ('active', 'scheduled')
    and (p_publish_at is null or p_publish_at <= now())
    and (p_unpublish_at is null or p_unpublish_at > now());
$$;

-- What the seller sees: "scheduled" until the window opens, "expired" after it.
create or replace function private.display_status(
  p_status text,
  p_publish_at timestamptz,
  p_unpublish_at timestamptz
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_status in ('active', 'scheduled') and p_unpublish_at is not null and p_unpublish_at <= now() then 'expired'
    when p_status in ('active', 'scheduled') and p_publish_at is not null and p_publish_at > now() then 'scheduled'
    when p_status = 'scheduled' then 'active'
    else p_status
  end;
$$;

grant execute on function
  private.is_publicly_visible(text, timestamptz, timestamptz),
  private.display_status(text, timestamptz, timestamptz)
to authenticated, service_role;

-- Returns machine-readable reasons a product cannot be published (empty = OK).
create or replace function private.product_publish_problems(p_product_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_specs public.product_physical_specs%rowtype;
  v_problems text[] := '{}';
  v_pickup_ok boolean;
begin
  select * into v_product from public.products where id = p_product_id;
  if not found then
    return array['not_found'];
  end if;
  select * into v_specs from public.product_physical_specs where product_id = p_product_id;

  if v_product.category_id is null then
    v_problems := array_append(v_problems, 'category_required');
  end if;
  if v_product.base_price_idr <= 0 then
    v_problems := array_append(v_problems, 'price_required');
  end if;
  if not exists (select 1 from public.product_images where product_id = p_product_id) then
    v_problems := array_append(v_problems, 'image_required');
  end if;
  if v_specs.product_id is null or v_specs.weight_grams is null then
    v_problems := array_append(v_problems, 'weight_required');
  end if;
  if v_specs.product_id is null or v_specs.length_cm is null or v_specs.width_cm is null or v_specs.height_cm is null then
    v_problems := array_append(v_problems, 'dimensions_required');
  end if;
  if v_specs.restricted_category = 'prohibited' then
    v_problems := array_append(v_problems, 'prohibited_item');
  end if;
  if not exists (select 1 from public.product_variants where product_id = p_product_id and active) then
    v_problems := array_append(v_problems, 'variant_required');
  end if;
  if v_product.unpublish_at is not null and v_product.unpublish_at <= now() then
    v_problems := array_append(v_problems, 'unpublish_in_past');
  end if;

  if v_product.pickup_address_id is not null then
    select active into v_pickup_ok from public.pickup_addresses where id = v_product.pickup_address_id;
  else
    select exists (
      select 1 from public.pickup_addresses
      where store_id = v_product.store_id and is_default and active
    ) into v_pickup_ok;
  end if;
  if not coalesce(v_pickup_ok, false) then
    v_problems := array_append(v_problems, 'pickup_address_required');
  end if;

  return v_problems;
end;
$$;

-- Seller-facing wrapper used for the editor's validation summary.
create or replace function public.seller_product_publish_check(p_product_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
begin
  select store_id into v_store_id from public.products where id = p_product_id;
  if v_store_id is null or not private.is_store_member(v_store_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  return private.product_publish_problems(p_product_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Product mutations
-- ---------------------------------------------------------------------------

-- Creates (p_product_id null) or updates a product with its physical specs,
-- variants + stock and attributes in one transaction. Never changes status,
-- except to flip active <-> scheduled when the publish window moves.
create or replace function public.seller_save_product(
  p_store_id uuid,
  p_product_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_store_id uuid;
  v_product public.products%rowtype;
  v_id uuid;
  v_specs jsonb := coalesce(p_payload -> 'specs', '{}'::jsonb);
  v_variants jsonb := coalesce(p_payload -> 'variants', '[]'::jsonb);
  v_variant jsonb;
  v_variant_id uuid;
  v_kept_ids uuid[] := '{}';
  v_index int := 0;
  v_on_hand int;
  v_old_on_hand int;
  v_problems text[];
begin
  if p_product_id is null then
    v_store_id := p_store_id;
  else
    select * into v_product from public.products where id = p_product_id for update;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;
    v_store_id := v_product.store_id;
  end if;

  perform private.assert_can_manage_catalog(v_store_id);

  if jsonb_typeof(v_variants) <> 'array' or jsonb_array_length(v_variants) = 0 then
    raise exception 'VALIDATION_ERROR' using detail = 'At least one variant is required.';
  end if;
  if jsonb_array_length(v_variants) > 50 then
    raise exception 'VALIDATION_ERROR' using detail = 'A product can have at most 50 variants.';
  end if;

  if p_product_id is not null then
    if v_product.status = 'archived' then
      raise exception 'VALIDATION_ERROR' using detail = 'Restore an archived product before editing it.';
    end if;
    if v_product.published_at is not null and v_product.slug <> (p_payload ->> 'slug') then
      raise exception 'VALIDATION_ERROR' using detail = 'The URL slug is locked after a product has been published.';
    end if;
  end if;

  if p_product_id is null then
    insert into public.products (
      store_id, category_id, slug, title, short_description, description, brand,
      material, color, tags, base_price_idr, compare_at_price_idr, max_qty_per_order,
      track_inventory, publish_at, unpublish_at, pickup_address_id, seo_title,
      seo_description, created_by, updated_by
    ) values (
      v_store_id,
      (p_payload ->> 'category_id')::uuid,
      p_payload ->> 'slug',
      p_payload ->> 'title',
      nullif(p_payload ->> 'short_description', ''),
      nullif(p_payload ->> 'description', ''),
      nullif(p_payload ->> 'brand', ''),
      nullif(p_payload ->> 'material', ''),
      nullif(p_payload ->> 'color', ''),
      coalesce(array(select jsonb_array_elements_text(p_payload -> 'tags')), '{}'),
      coalesce((p_payload ->> 'base_price_idr')::bigint, 0),
      (p_payload ->> 'compare_at_price_idr')::bigint,
      (p_payload ->> 'max_qty_per_order')::int,
      coalesce((p_payload ->> 'track_inventory')::boolean, true),
      (p_payload ->> 'publish_at')::timestamptz,
      (p_payload ->> 'unpublish_at')::timestamptz,
      (p_payload ->> 'pickup_address_id')::uuid,
      nullif(p_payload ->> 'seo_title', ''),
      nullif(p_payload ->> 'seo_description', ''),
      v_uid,
      v_uid
    )
    returning id into v_id;
  else
    v_id := p_product_id;
    update public.products set
      category_id = (p_payload ->> 'category_id')::uuid,
      slug = p_payload ->> 'slug',
      title = p_payload ->> 'title',
      short_description = nullif(p_payload ->> 'short_description', ''),
      description = nullif(p_payload ->> 'description', ''),
      brand = nullif(p_payload ->> 'brand', ''),
      material = nullif(p_payload ->> 'material', ''),
      color = nullif(p_payload ->> 'color', ''),
      tags = coalesce(array(select jsonb_array_elements_text(p_payload -> 'tags')), '{}'),
      base_price_idr = coalesce((p_payload ->> 'base_price_idr')::bigint, 0),
      compare_at_price_idr = (p_payload ->> 'compare_at_price_idr')::bigint,
      max_qty_per_order = (p_payload ->> 'max_qty_per_order')::int,
      track_inventory = coalesce((p_payload ->> 'track_inventory')::boolean, true),
      publish_at = (p_payload ->> 'publish_at')::timestamptz,
      unpublish_at = (p_payload ->> 'unpublish_at')::timestamptz,
      pickup_address_id = (p_payload ->> 'pickup_address_id')::uuid,
      seo_title = nullif(p_payload ->> 'seo_title', ''),
      seo_description = nullif(p_payload ->> 'seo_description', ''),
      updated_by = v_uid
    where id = v_id;
  end if;

  insert into public.product_physical_specs (
    product_id, store_id, weight_grams, length_cm, width_cm, height_cm,
    packaging_weight_grams, fragile, liquid, restricted_category, handling_days,
    care_instructions, packaging_notes
  ) values (
    v_id,
    v_store_id,
    (v_specs ->> 'weight_grams')::int,
    (v_specs ->> 'length_cm')::numeric,
    (v_specs ->> 'width_cm')::numeric,
    (v_specs ->> 'height_cm')::numeric,
    coalesce((v_specs ->> 'packaging_weight_grams')::int, 0),
    coalesce((v_specs ->> 'fragile')::boolean, false),
    coalesce((v_specs ->> 'liquid')::boolean, false),
    coalesce(v_specs ->> 'restricted_category', 'none'),
    coalesce((v_specs ->> 'handling_days')::int, 1),
    nullif(v_specs ->> 'care_instructions', ''),
    nullif(v_specs ->> 'packaging_notes', '')
  )
  on conflict (product_id) do update set
    weight_grams = excluded.weight_grams,
    length_cm = excluded.length_cm,
    width_cm = excluded.width_cm,
    height_cm = excluded.height_cm,
    packaging_weight_grams = excluded.packaging_weight_grams,
    fragile = excluded.fragile,
    liquid = excluded.liquid,
    restricted_category = excluded.restricted_category,
    handling_days = excluded.handling_days,
    care_instructions = excluded.care_instructions,
    packaging_notes = excluded.packaging_notes;

  -- Variants: rows absent from the payload are deactivated, never deleted,
  -- because historical order items may reference them.
  for v_variant in select value from jsonb_array_elements(v_variants) loop
    v_variant_id := nullif(v_variant ->> 'id', '')::uuid;
    if v_variant_id is not null then
      perform 1 from public.product_variants
      where id = v_variant_id and product_id = v_id and active;
      if not found then
        raise exception 'VALIDATION_ERROR' using detail = 'Unknown variant for this product.';
      end if;
      v_kept_ids := v_kept_ids || v_variant_id;
    end if;
  end loop;

  update public.product_variants
  set active = false, is_default = false
  where product_id = v_id and active and not (id = any (v_kept_ids));

  -- Clear the default flag first so the one-default index is never violated mid-way.
  update public.product_variants set is_default = false where product_id = v_id and is_default;

  for v_variant in select value from jsonb_array_elements(v_variants) loop
    v_variant_id := nullif(v_variant ->> 'id', '')::uuid;
    v_on_hand := coalesce((v_variant ->> 'on_hand')::int, 0);

    if v_variant_id is null then
      insert into public.product_variants (
        store_id, product_id, title, sku, option_values, is_default,
        price_override_idr, weight_override_grams, sort_order
      ) values (
        v_store_id,
        v_id,
        coalesce(nullif(v_variant ->> 'title', ''), 'Default'),
        nullif(v_variant ->> 'sku', ''),
        coalesce(v_variant -> 'option_values', '{}'::jsonb),
        v_index = 0,
        (v_variant ->> 'price_override_idr')::bigint,
        (v_variant ->> 'weight_override_grams')::int,
        v_index
      )
      returning id into v_variant_id;

      insert into public.inventory (store_id, variant_id, on_hand, low_stock_threshold)
      values (v_store_id, v_variant_id, v_on_hand, coalesce((v_variant ->> 'low_stock_threshold')::int, 5));

      if v_on_hand <> 0 then
        insert into public.inventory_movements (store_id, variant_id, delta_on_hand, reason, actor_id)
        values (v_store_id, v_variant_id, v_on_hand, 'initial_stock', v_uid);
      end if;
    else
      update public.product_variants set
        title = coalesce(nullif(v_variant ->> 'title', ''), 'Default'),
        sku = nullif(v_variant ->> 'sku', ''),
        option_values = coalesce(v_variant -> 'option_values', '{}'::jsonb),
        is_default = (v_index = 0),
        price_override_idr = (v_variant ->> 'price_override_idr')::bigint,
        weight_override_grams = (v_variant ->> 'weight_override_grams')::int,
        sort_order = v_index
      where id = v_variant_id;

      select on_hand into v_old_on_hand from public.inventory where variant_id = v_variant_id for update;
      update public.inventory set
        on_hand = v_on_hand,
        low_stock_threshold = coalesce((v_variant ->> 'low_stock_threshold')::int, low_stock_threshold)
      where variant_id = v_variant_id;

      if v_on_hand <> v_old_on_hand then
        insert into public.inventory_movements (store_id, variant_id, delta_on_hand, reason, actor_id)
        values (v_store_id, v_variant_id, v_on_hand - v_old_on_hand, 'manual_adjustment', v_uid);
      end if;
    end if;

    v_index := v_index + 1;
  end loop;

  -- Attributes are replaced wholesale.
  delete from public.product_attributes where product_id = v_id;
  insert into public.product_attributes (store_id, product_id, label, value, unit, is_public, sort_order)
  select
    v_store_id,
    v_id,
    a.value ->> 'label',
    a.value ->> 'value',
    nullif(a.value ->> 'unit', ''),
    coalesce((a.value ->> 'is_public')::boolean, true),
    (a.ordinality - 1)::int
  from jsonb_array_elements(coalesce(p_payload -> 'attributes', '[]'::jsonb)) with ordinality as a(value, ordinality);

  -- A live product must stay publishable after edits.
  select * into v_product from public.products where id = v_id;
  if v_product.status in ('active', 'scheduled') then
    v_problems := private.product_publish_problems(v_id);
    if cardinality(v_problems) > 0 then
      raise exception 'PUBLISH_REQUIREMENTS' using detail = array_to_string(v_problems, ',');
    end if;
    update public.products
    set status = case when publish_at is not null and publish_at > now() then 'scheduled' else 'active' end
    where id = v_id;
  end if;

  return v_id;
end;
$$;

-- Server-validated status transitions.
--   publish : draft|paused        -> active (or scheduled if publish_at is in the future)
--   pause   : active|scheduled    -> paused
--   archive : any non-archived    -> archived (soft delete; history preserved)
--   restore : archived            -> draft
--   unpublish: active|scheduled|paused -> draft
create or replace function public.seller_set_product_status(p_product_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_problems text[];
  v_next text;
begin
  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_product.store_id);

  case p_action
    when 'publish' then
      if v_product.status not in ('draft', 'paused') then
        raise exception 'INVALID_TRANSITION' using detail = format('Cannot publish a %s product.', v_product.status);
      end if;
      v_problems := private.product_publish_problems(p_product_id);
      if cardinality(v_problems) > 0 then
        raise exception 'PUBLISH_REQUIREMENTS' using detail = array_to_string(v_problems, ',');
      end if;
      v_next := case when v_product.publish_at is not null and v_product.publish_at > now() then 'scheduled' else 'active' end;
    when 'pause' then
      if v_product.status not in ('active', 'scheduled') then
        raise exception 'INVALID_TRANSITION' using detail = format('Cannot pause a %s product.', v_product.status);
      end if;
      v_next := 'paused';
    when 'unpublish' then
      if v_product.status not in ('active', 'scheduled', 'paused') then
        raise exception 'INVALID_TRANSITION' using detail = format('Cannot unpublish a %s product.', v_product.status);
      end if;
      v_next := 'draft';
    when 'archive' then
      if v_product.status = 'archived' then
        raise exception 'INVALID_TRANSITION' using detail = 'Product is already archived.';
      end if;
      v_next := 'archived';
    when 'restore' then
      if v_product.status <> 'archived' then
        raise exception 'INVALID_TRANSITION' using detail = 'Only archived products can be restored.';
      end if;
      v_next := 'draft';
    else
      raise exception 'VALIDATION_ERROR' using detail = 'Unknown status action.';
  end case;

  update public.products
  set status = v_next,
      published_at = case when v_next in ('active', 'scheduled') then coalesce(published_at, now()) else published_at end,
      updated_by = (select auth.uid())
  where id = p_product_id;

  return v_next;
end;
$$;

-- Copies a product as a new draft. SKUs and stock are not copied (SKUs must be
-- unique; stock is physical). Images are not copied: storage objects belong to
-- one product so deleting them can never break another listing.
create or replace function public.seller_duplicate_product(p_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_src public.products%rowtype;
  v_new_id uuid;
  v_slug text;
  v_suffix int := 1;
begin
  select * into v_src from public.products where id = p_product_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_src.store_id);

  loop
    v_slug := left(v_src.slug, 170) || '-copy' || case when v_suffix > 1 then '-' || v_suffix else '' end;
    exit when not exists (select 1 from public.products where store_id = v_src.store_id and slug = v_slug);
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.products (
    store_id, category_id, slug, title, short_description, description, brand, material,
    color, tags, base_price_idr, compare_at_price_idr, max_qty_per_order, track_inventory,
    pickup_address_id, seo_title, seo_description, created_by, updated_by
  ) values (
    v_src.store_id, v_src.category_id, v_slug, left(v_src.title || ' (copy)', 160),
    v_src.short_description, v_src.description, v_src.brand, v_src.material, v_src.color,
    v_src.tags, v_src.base_price_idr, v_src.compare_at_price_idr, v_src.max_qty_per_order,
    v_src.track_inventory, v_src.pickup_address_id, v_src.seo_title, v_src.seo_description,
    (select auth.uid()), (select auth.uid())
  )
  returning id into v_new_id;

  insert into public.product_physical_specs (
    product_id, store_id, weight_grams, length_cm, width_cm, height_cm, packaging_weight_grams,
    fragile, liquid, restricted_category, handling_days, care_instructions, packaging_notes
  )
  select v_new_id, store_id, weight_grams, length_cm, width_cm, height_cm, packaging_weight_grams,
    fragile, liquid, restricted_category, handling_days, care_instructions, packaging_notes
  from public.product_physical_specs where product_id = p_product_id;

  with src as (
    select * from public.product_variants where product_id = p_product_id and active
  ), ins as (
    insert into public.product_variants (
      store_id, product_id, title, sku, option_values, is_default, price_override_idr,
      weight_override_grams, sort_order
    )
    select store_id, v_new_id, title, null, option_values, is_default, price_override_idr,
      weight_override_grams, sort_order
    from src
    returning id, store_id
  )
  insert into public.inventory (store_id, variant_id, on_hand)
  select store_id, id, 0 from ins;

  insert into public.product_attributes (store_id, product_id, label, value, unit, is_public, sort_order)
  select store_id, v_new_id, label, value, unit, is_public, sort_order
  from public.product_attributes where product_id = p_product_id;

  return v_new_id;
end;
$$;

-- Registers an image that the caller already uploaded to
-- product-images/{store_id}/{product_id}/... (storage RLS enforces the prefix).
create or replace function public.seller_add_product_image(
  p_product_id uuid,
  p_storage_path text,
  p_alt_text text,
  p_width_px int,
  p_height_px int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_status text;
  v_id uuid;
  v_next_order int;
begin
  select store_id, status into v_store_id, v_status from public.products where id = p_product_id for update;
  if v_store_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_store_id);
  if v_status = 'archived' then
    raise exception 'VALIDATION_ERROR' using detail = 'Restore an archived product before editing it.';
  end if;
  if p_storage_path is null or p_storage_path not like v_store_id::text || '/' || p_product_id::text || '/%' then
    raise exception 'VALIDATION_ERROR' using detail = 'Image path does not belong to this product.';
  end if;
  if (select count(*) from public.product_images where product_id = p_product_id) >= 10 then
    raise exception 'VALIDATION_ERROR' using detail = 'A product can have at most 10 images.';
  end if;

  select coalesce(max(sort_order) + 1, 0) into v_next_order
  from public.product_images where product_id = p_product_id;

  insert into public.product_images (store_id, product_id, storage_path, alt_text, sort_order, width_px, height_px)
  values (v_store_id, p_product_id, p_storage_path, coalesce(left(p_alt_text, 200), ''), v_next_order, p_width_px, p_height_px)
  returning id into v_id;

  return v_id;
end;
$$;

-- Removes an image row and returns its storage path so the caller can delete the object.
-- Refuses to remove the last image of a live product.
create or replace function public.seller_delete_product_image(p_image_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_image public.product_images%rowtype;
  v_status text;
begin
  select * into v_image from public.product_images where id = p_image_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_image.store_id);
  select status into v_status from public.products where id = v_image.product_id for update;

  if v_status in ('active', 'scheduled')
     and (select count(*) from public.product_images where product_id = v_image.product_id) <= 1 then
    raise exception 'PUBLISH_REQUIREMENTS' using detail = 'image_required';
  end if;

  delete from public.product_images where id = p_image_id;

  -- Re-pack sort order so the first image stays the main image.
  with ordered as (
    select id, row_number() over (order by sort_order, created_at) - 1 as rn
    from public.product_images where product_id = v_image.product_id
  )
  update public.product_images i set sort_order = o.rn from ordered o where i.id = o.id;

  return v_image.storage_path;
end;
$$;

create or replace function public.seller_set_main_product_image(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_image public.product_images%rowtype;
begin
  select * into v_image from public.product_images where id = p_image_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform private.assert_can_manage_catalog(v_image.store_id);

  with ordered as (
    select id, row_number() over (order by (id = p_image_id) desc, sort_order, created_at) - 1 as rn
    from public.product_images where product_id = v_image.product_id
  )
  update public.product_images i set sort_order = o.rn from ordered o where i.id = o.id;
end;
$$;

create or replace function public.seller_save_category(p_store_id uuid, p_category_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_id uuid;
begin
  if p_category_id is null then
    v_store_id := p_store_id;
  else
    select store_id into v_store_id from public.categories where id = p_category_id;
    if v_store_id is null then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;
  perform private.assert_can_manage_catalog(v_store_id);

  if p_category_id is null then
    insert into public.categories (store_id, name, slug, sort_order)
    values (v_store_id, p_name, p_slug,
      (select coalesce(max(sort_order) + 1, 0) from public.categories where store_id = v_store_id))
    returning id into v_id;
  else
    update public.categories set name = p_name, slug = p_slug where id = p_category_id returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS + grants (sellers read own store; all writes via functions above)
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_physical_specs enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_attributes enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;

revoke all on
  public.categories, public.products, public.product_physical_specs, public.product_variants,
  public.product_attributes, public.product_images, public.inventory, public.inventory_movements
from anon, authenticated;

grant select on
  public.categories, public.products, public.product_physical_specs, public.product_variants,
  public.product_attributes, public.product_images, public.inventory, public.inventory_movements
to authenticated;

create policy categories_select_member on public.categories
  for select to authenticated using (private.is_store_member(store_id));
create policy products_select_member on public.products
  for select to authenticated using (private.is_store_member(store_id));
create policy product_physical_specs_select_member on public.product_physical_specs
  for select to authenticated using (private.is_store_member(store_id));
create policy product_variants_select_member on public.product_variants
  for select to authenticated using (private.is_store_member(store_id));
create policy product_attributes_select_member on public.product_attributes
  for select to authenticated using (private.is_store_member(store_id));
create policy product_images_select_member on public.product_images
  for select to authenticated using (private.is_store_member(store_id));
create policy inventory_select_member on public.inventory
  for select to authenticated using (private.is_store_member(store_id));
create policy inventory_movements_select_member on public.inventory_movements
  for select to authenticated using (private.is_store_member(store_id));

revoke all on function
  private.product_publish_problems(uuid),
  public.seller_product_publish_check(uuid),
  public.seller_save_product(uuid, uuid, jsonb),
  public.seller_set_product_status(uuid, text),
  public.seller_duplicate_product(uuid),
  public.seller_add_product_image(uuid, text, text, int, int),
  public.seller_delete_product_image(uuid),
  public.seller_set_main_product_image(uuid),
  public.seller_save_category(uuid, uuid, text, text)
from public, anon;

grant execute on function
  public.seller_product_publish_check(uuid),
  public.seller_save_product(uuid, uuid, jsonb),
  public.seller_set_product_status(uuid, text),
  public.seller_duplicate_product(uuid),
  public.seller_add_product_image(uuid, text, text, int, int),
  public.seller_delete_product_image(uuid),
  public.seller_set_main_product_image(uuid),
  public.seller_save_category(uuid, uuid, text, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- Seller list view (security_invoker: RLS of the caller applies)
-- ---------------------------------------------------------------------------

create view public.seller_product_overview
with (security_invoker = true)
as
select
  p.id,
  p.store_id,
  p.slug,
  p.title,
  p.status,
  private.display_status(p.status, p.publish_at, p.unpublish_at) as display_status,
  p.category_id,
  c.name as category_name,
  p.base_price_idr,
  p.compare_at_price_idr,
  p.publish_at,
  p.unpublish_at,
  p.track_inventory,
  p.updated_at,
  p.created_at,
  img.storage_path as main_image_path,
  coalesce(v.variant_count, 0) as variant_count,
  coalesce(v.skus, '') as skus,
  coalesce(v.available_qty, 0) as available_qty,
  coalesce(v.low_stock, false) as low_stock
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select i.storage_path
  from public.product_images i
  where i.product_id = p.id
  order by i.sort_order, i.created_at
  limit 1
) img on true
left join lateral (
  select
    count(*)::int as variant_count,
    string_agg(pv.sku, ' ' order by pv.sort_order) as skus,
    sum(greatest(inv.on_hand - inv.reserved, 0))::int as available_qty,
    bool_or(inv.on_hand - inv.reserved <= inv.low_stock_threshold) as low_stock
  from public.product_variants pv
  join public.inventory inv on inv.variant_id = pv.id
  where pv.product_id = p.id and pv.active
) v on true;

revoke all on public.seller_product_overview from anon, authenticated;
grant select on public.seller_product_overview to authenticated;

-- ---------------------------------------------------------------------------
-- Storefront (buyer) contract — read-only, schedule-aware, no seller-only data.
-- These views run with owner privileges on purpose (security_barrier) and
-- expose only safe columns of publicly visible rows.
-- ---------------------------------------------------------------------------

create view public.storefront_categories
with (security_barrier = true)
as
select c.id, c.store_id, c.name, c.slug, c.sort_order
from public.categories c
where c.is_active;

create view public.storefront_products
with (security_barrier = true)
as
select
  p.id,
  p.store_id,
  s.slug as store_slug,
  s.mode as store_mode,
  p.slug,
  p.title,
  p.short_description,
  p.description,
  p.brand,
  p.material,
  p.color,
  p.tags,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name,
  p.base_price_idr,
  case when p.compare_at_price_idr > p.base_price_idr then p.compare_at_price_idr end as compare_at_price_idr,
  p.max_qty_per_order,
  p.publish_at,
  p.unpublish_at,
  p.seo_title,
  p.seo_description,
  ps.weight_grams,
  ps.length_cm,
  ps.width_cm,
  ps.height_cm,
  ps.fragile,
  ps.liquid,
  ps.handling_days,
  ps.care_instructions,
  img.storage_path as main_image_path,
  img.alt_text as main_image_alt,
  (p.track_inventory and coalesce(v.available_qty, 0) = 0) as is_sold_out,
  p.updated_at
from public.products p
join public.stores s on s.id = p.store_id
left join public.categories c on c.id = p.category_id and c.is_active
left join public.product_physical_specs ps on ps.product_id = p.id
left join lateral (
  select i.storage_path, i.alt_text
  from public.product_images i
  where i.product_id = p.id
  order by i.sort_order, i.created_at
  limit 1
) img on true
left join lateral (
  select sum(greatest(inv.on_hand - inv.reserved, 0))::int as available_qty
  from public.product_variants pv
  join public.inventory inv on inv.variant_id = pv.id
  where pv.product_id = p.id and pv.active
) v on true
where private.is_publicly_visible(p.status, p.publish_at, p.unpublish_at);

create view public.storefront_product_variants
with (security_barrier = true)
as
select
  pv.id,
  pv.product_id,
  pv.title,
  pv.sku,
  pv.option_values,
  pv.is_default,
  pv.sort_order,
  coalesce(pv.price_override_idr, p.base_price_idr) as price_idr,
  case when p.track_inventory then greatest(inv.on_hand - inv.reserved, 0) end as available_qty,
  (not p.track_inventory or inv.on_hand - inv.reserved > 0) as in_stock
from public.product_variants pv
join public.products p on p.id = pv.product_id
join public.inventory inv on inv.variant_id = pv.id
where pv.active
  and private.is_publicly_visible(p.status, p.publish_at, p.unpublish_at);

create view public.storefront_product_images
with (security_barrier = true)
as
select i.id, i.product_id, i.storage_path, i.alt_text, i.sort_order, i.width_px, i.height_px
from public.product_images i
join public.products p on p.id = i.product_id
where private.is_publicly_visible(p.status, p.publish_at, p.unpublish_at);

create view public.storefront_product_attributes
with (security_barrier = true)
as
select a.id, a.product_id, a.label, a.value, a.unit, a.sort_order
from public.product_attributes a
join public.products p on p.id = a.product_id
where a.is_public
  and private.is_publicly_visible(p.status, p.publish_at, p.unpublish_at);

revoke all on
  public.storefront_categories, public.storefront_products, public.storefront_product_variants,
  public.storefront_product_images, public.storefront_product_attributes
from anon, authenticated;

grant select on
  public.storefront_categories, public.storefront_products, public.storefront_product_variants,
  public.storefront_product_images, public.storefront_product_attributes
to anon, authenticated;

-- Views that call private.* run as the view owner, but anon still needs USAGE
-- on the schema to resolve the function reference.
grant usage on schema private to anon;
grant execute on function private.is_publicly_visible(text, timestamptz, timestamptz) to anon;
