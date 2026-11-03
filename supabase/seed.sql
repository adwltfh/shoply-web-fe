-- Shoply DEMO seed. Synthetic, non-sensitive data only.
-- Owner membership is NOT created here: run `bun run provision:owner` (service
-- role) so no public signup path can ever grant store access.

insert into public.stores (id, name, slug, timezone, mode)
values ('00000000-0000-4000-8000-000000000001', 'Shoply Demo Store', 'shoply-demo', 'Asia/Jakarta', 'demo')
on conflict (id) do nothing;

insert into public.categories (id, store_id, name, slug, sort_order) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Electronics', 'electronics', 0),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Fashion', 'fashion', 1),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Beauty & Care', 'beauty-care', 2),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Home & Living', 'home-living', 3),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'Accessories', 'accessories', 4),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', 'Sports & Lifestyle', 'sports-lifestyle', 5)
on conflict (id) do nothing;

-- Fictional address for DEMO mode.
insert into public.pickup_addresses (
  id, store_id, label, contact_name, phone, province, city, district,
  street_address, postal_code, is_default
) values (
  '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001',
  'Demo Warehouse', 'Demo Operator', '+62 811 0000 0000', 'Jawa Barat', 'Bandung', 'Coblong',
  'Jl. Contoh Demo No. 1 (fictional)', '40132', true
)
on conflict (id) do nothing;

-- Two draft products. They need a photo before they can be published.
insert into public.products (
  id, store_id, category_id, slug, title, short_description, description, material,
  base_price_idr, compare_at_price_idr, status
) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000102', 'everyday-cotton-tee', 'Everyday Cotton Tee',
   'Soft cotton t-shirt (demo item).', 'Demo product for testing the Shoply seller flow. Not for sale.',
   'Cotton', 129000, 159000, 'draft'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000104', 'oak-serving-board', 'Oak Serving Board',
   'Solid wood serving board (demo item).', 'Demo product for testing the Shoply seller flow. Not for sale.',
   'Oak wood', 245000, null, 'draft')
on conflict (id) do nothing;

insert into public.product_physical_specs (
  product_id, store_id, weight_grams, length_cm, width_cm, height_cm, packaging_weight_grams, fragile, handling_days
) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 500, 20, 12, 8, 50, false, 1),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 900, 40, 25, 2, 150, true, 2)
on conflict (product_id) do nothing;

insert into public.product_variants (id, store_id, product_id, title, sku, option_values, is_default, sort_order) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000301', 'M', 'TEE-COT-M', '{"Size":"M"}', true, 0),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000301', 'L', 'TEE-COT-L', '{"Size":"L"}', false, 1),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000302', 'Default', 'BRD-OAK-01', '{}', true, 0)
on conflict (id) do nothing;

insert into public.inventory (store_id, variant_id, on_hand, low_stock_threshold) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000401', 12, 3),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000402', 4, 3),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000403', 6, 2)
on conflict (variant_id) do nothing;

insert into public.inventory_movements (store_id, variant_id, delta_on_hand, reason)
select inv.store_id, inv.variant_id, inv.on_hand, 'initial_stock'
from public.inventory inv
where inv.variant_id in (
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000402',
  '00000000-0000-4000-8000-000000000403'
)
and not exists (
  select 1 from public.inventory_movements m where m.variant_id = inv.variant_id and m.reason = 'initial_stock'
);
