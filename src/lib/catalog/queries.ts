import "server-only";

import type { DisplayStatus, ProductStatus } from "@/contracts/catalog";
import type { SellerContext } from "@/lib/auth/dal";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PAGE_SIZE = 20;

export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export type ProductListRow = {
  id: string;
  slug: string;
  title: string;
  status: ProductStatus;
  display_status: DisplayStatus;
  category_name: string | null;
  base_price_idr: number;
  publish_at: string | null;
  unpublish_at: string | null;
  updated_at: string;
  main_image_path: string | null;
  variant_count: number;
  skus: string;
  available_qty: number;
  low_stock: boolean;
  track_inventory: boolean;
};

export type ProductListFilters = {
  q?: string;
  status?: string;
  category?: string;
  stock?: string;
  page?: number;
};

const LIST_STATUSES = new Set(["draft", "scheduled", "active", "paused", "expired", "archived"]);

/** Strip characters that carry meaning in PostgREST filter syntax. */
function sanitizeSearch(q: string) {
  return q.replace(/[%,()*\\:."']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function listProducts(ctx: SellerContext, filters: ProductListFilters) {
  const supabase = await createClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  let query = supabase
    .from("seller_product_overview")
    .select(
      "id, slug, title, status, display_status, category_name, base_price_idr, publish_at, unpublish_at, updated_at, main_image_path, variant_count, skus, available_qty, low_stock, track_inventory",
      { count: "exact" },
    )
    .eq("store_id", ctx.store.id);

  const q = filters.q ? sanitizeSearch(filters.q) : "";
  if (q) query = query.or(`title.ilike.*${q}*,skus.ilike.*${q}*`);
  if (filters.status && LIST_STATUSES.has(filters.status)) {
    query = query.eq("display_status", filters.status);
  } else {
    query = query.neq("status", "archived");
  }
  if (filters.category && /^[0-9a-f-]{36}$/i.test(filters.category)) query = query.eq("category_id", filters.category);
  if (filters.stock === "low") query = query.eq("low_stock", true).gt("available_qty", 0);
  if (filters.stock === "out") query = query.eq("available_qty", 0).eq("track_inventory", true);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error("Could not load products.");
  return { rows: (data ?? []) as ProductListRow[], total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export type CategoryRow = { id: string; name: string; slug: string; sort_order: number; is_active: boolean };

export async function listCategories(ctx: SellerContext) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, is_active")
    .eq("store_id", ctx.store.id)
    .order("sort_order")
    .order("name");
  if (error) throw new Error("Could not load categories.");
  return (data ?? []) as CategoryRow[];
}

export type PickupAddressRow = {
  id: string;
  label: string;
  contact_name: string;
  phone: string;
  province: string;
  city: string;
  district: string | null;
  street_address: string;
  postal_code: string | null;
  notes: string | null;
  province_code: string | null;
  city_code: string | null;
  district_code: string | null;
  provider_location_code: string | null;
  is_default: boolean;
  active: boolean;
};

export async function listPickupAddresses(ctx: SellerContext) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pickup_addresses")
    .select(
      "id, label, contact_name, phone, province, city, district, street_address, postal_code, notes, province_code, city_code, district_code, provider_location_code, is_default, active",
    )
    .eq("store_id", ctx.store.id)
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) throw new Error("Could not load pickup addresses.");
  return (data ?? []) as PickupAddressRow[];
}

export type ProductEditData = {
  id: string;
  status: ProductStatus;
  display_status: DisplayStatus;
  published_at: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  material: string | null;
  color: string | null;
  tags: string[];
  base_price_idr: number;
  compare_at_price_idr: number | null;
  max_qty_per_order: number | null;
  track_inventory: boolean;
  publish_at: string | null;
  unpublish_at: string | null;
  pickup_address_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  specs: {
    weight_grams: number | null;
    length_cm: number | null;
    width_cm: number | null;
    height_cm: number | null;
    packaging_weight_grams: number;
    fragile: boolean;
    liquid: boolean;
    restricted_category: string;
    handling_days: number;
    care_instructions: string | null;
    packaging_notes: string | null;
  } | null;
  variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    option_values: Record<string, string>;
    price_override_idr: number | null;
    weight_override_grams: number | null;
    sort_order: number;
    on_hand: number;
    reserved: number;
    low_stock_threshold: number;
  }>;
  attributes: Array<{ label: string; value: string; unit: string | null; is_public: boolean; sort_order: number }>;
  images: Array<{ id: string; storage_path: string; alt_text: string; sort_order: number; width_px: number | null; height_px: number | null; url: string }>;
  publish_problems: string[];
};

type RawProduct = Omit<ProductEditData, "specs" | "variants" | "attributes" | "images" | "publish_problems" | "display_status"> & {
  specs: ProductEditData["specs"] | ProductEditData["specs"][];
  variants: Array<Omit<ProductEditData["variants"][number], "on_hand" | "reserved" | "low_stock_threshold"> & {
    active: boolean;
    inventory: { on_hand: number; reserved: number; low_stock_threshold: number } | { on_hand: number; reserved: number; low_stock_threshold: number }[] | null;
  }>;
  attributes: ProductEditData["attributes"];
  images: Array<Omit<ProductEditData["images"][number], "url">>;
};

const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

export async function getProductForEdit(ctx: SellerContext, productId: string): Promise<ProductEditData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, status, published_at, title, slug, short_description, description, category_id, brand, material, color, tags,
       base_price_idr, compare_at_price_idr, max_qty_per_order, track_inventory, publish_at, unpublish_at, pickup_address_id,
       seo_title, seo_description, updated_at,
       specs:product_physical_specs(weight_grams, length_cm, width_cm, height_cm, packaging_weight_grams, fragile, liquid, restricted_category, handling_days, care_instructions, packaging_notes),
       variants:product_variants(id, title, sku, option_values, price_override_idr, weight_override_grams, sort_order, active, inventory(on_hand, reserved, low_stock_threshold)),
       attributes:product_attributes(label, value, unit, is_public, sort_order),
       images:product_images(id, storage_path, alt_text, sort_order, width_px, height_px)`,
    )
    .eq("id", productId)
    .eq("store_id", ctx.store.id)
    .maybeSingle<RawProduct>();

  if (error) throw new Error("Could not load the product.");
  if (!data) return null;

  const [{ data: problems }, { data: overview }] = await Promise.all([
    supabase.rpc("seller_product_publish_check", { p_product_id: productId }),
    supabase.from("seller_product_overview").select("display_status").eq("id", productId).maybeSingle<{ display_status: DisplayStatus }>(),
  ]);

  const specs = one(data.specs);
  return {
    ...data,
    display_status: overview?.display_status ?? data.status,
    specs: specs
      ? { ...specs, length_cm: specs.length_cm == null ? null : Number(specs.length_cm), width_cm: specs.width_cm == null ? null : Number(specs.width_cm), height_cm: specs.height_cm == null ? null : Number(specs.height_cm) }
      : null,
    variants: data.variants
      .filter((v) => v.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => {
        const inv = one(v.inventory);
        return {
          id: v.id,
          title: v.title,
          sku: v.sku,
          option_values: v.option_values,
          price_override_idr: v.price_override_idr,
          weight_override_grams: v.weight_override_grams,
          sort_order: v.sort_order,
          on_hand: inv?.on_hand ?? 0,
          reserved: inv?.reserved ?? 0,
          low_stock_threshold: inv?.low_stock_threshold ?? 5,
        };
      }),
    attributes: [...data.attributes].sort((a, b) => a.sort_order - b.sort_order),
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => ({ ...img, url: productImageUrl(img.storage_path) ?? "" })),
    publish_problems: (problems as string[] | null) ?? [],
  };
}

export async function getCatalogSummary(ctx: SellerContext) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seller_product_overview")
    .select("id, title, display_status, available_qty, low_stock, track_inventory, publish_at, updated_at")
    .eq("store_id", ctx.store.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Could not load the catalog summary.");
  const rows = (data ?? []) as Array<Pick<ProductListRow, "id" | "title" | "display_status" | "available_qty" | "low_stock" | "track_inventory" | "publish_at" | "updated_at">>;
  const count = (status: DisplayStatus) => rows.filter((r) => r.display_status === status).length;
  const lowStock = rows.filter((r) => r.track_inventory && r.low_stock && r.display_status === "active");
  return {
    total: rows.length,
    active: count("active"),
    scheduled: count("scheduled"),
    draft: count("draft"),
    paused: count("paused"),
    expired: count("expired"),
    lowStock,
    upcoming: rows.filter((r) => r.display_status === "scheduled").sort((a, b) => (a.publish_at ?? "").localeCompare(b.publish_at ?? "")).slice(0, 5),
    recentDrafts: rows.filter((r) => r.display_status === "draft").slice(0, 5),
  };
}
