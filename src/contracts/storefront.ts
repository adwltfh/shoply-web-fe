// Buyer-facing (Shoply Mini) read contract, version 1.
// Rows of the public storefront_* views. Anonymous clients may read ONLY these
// views; every raw table is denied to `anon`. The views already apply the
// server-time visibility predicate, so the buyer never filters by status.
//
// Copy this file into the Expo app (or publish it as a package) and keep the
// version in sync with docs/buyer-integration.md.

export const STOREFRONT_CONTRACT_VERSION = 1;
export const PRODUCT_IMAGE_BUCKET = "product-images";

export type StorefrontCategory = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type StorefrontProduct = {
  id: string;
  store_id: string;
  store_slug: string;
  /** 'demo' => show the non-payable demo banner. */
  store_mode: "demo" | "live";
  slug: string;
  title: string;
  short_description: string | null;
  /** Plain text. Render as text, never as HTML. */
  description: string | null;
  brand: string | null;
  material: string | null;
  color: string | null;
  tags: string[];
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  /** Integer IDR. Display only; checkout re-prices on the server. */
  base_price_idr: number;
  /** Present only when higher than base_price_idr. */
  compare_at_price_idr: number | null;
  max_qty_per_order: number | null;
  publish_at: string | null;
  unpublish_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  weight_grams: number | null;
  length_cm: string | null; // numeric arrives as string from PostgREST
  width_cm: string | null;
  height_cm: string | null;
  fragile: boolean | null;
  liquid: boolean | null;
  handling_days: number | null;
  care_instructions: string | null;
  main_image_path: string | null;
  main_image_alt: string | null;
  /** Visible but not purchasable when true. */
  is_sold_out: boolean;
  updated_at: string;
};

export type StorefrontVariant = {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  option_values: Record<string, string>;
  is_default: boolean;
  sort_order: number;
  price_idr: number;
  /** null when the product does not track inventory. */
  available_qty: number | null;
  in_stock: boolean;
};

export type StorefrontImage = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  width_px: number | null;
  height_px: number | null;
};

export type StorefrontAttribute = {
  id: string;
  product_id: string;
  label: string;
  value: string;
  unit: string | null;
  sort_order: number;
};

/** Public URL for a catalog image path (bucket is public-read). */
export function storefrontImageUrl(supabaseUrl: string, storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}
