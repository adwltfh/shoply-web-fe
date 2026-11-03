import { z } from "zod";

// Seller-side input contract for products. The server action validates with
// these schemas before calling seller_save_product; the database re-checks the
// same invariants with CHECK constraints.

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKU_RE = /^[A-Za-z0-9._-]{1,64}$/;

export const PRODUCT_STATUSES = ["draft", "scheduled", "active", "paused", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type DisplayStatus = ProductStatus | "expired";

export const RESTRICTED_CATEGORIES = ["none", "lithium_battery", "flammable", "aerosol", "magnetic", "prohibited"] as const;

export const PRODUCT_STATUS_ACTIONS = ["publish", "pause", "unpublish", "archive", "restore"] as const;
export type ProductStatusAction = (typeof PRODUCT_STATUS_ACTIONS)[number];

const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : emptyToNull(v)),
    z.string().max(max, `Use at most ${max} characters.`).nullable(),
  );

const optionalInt = (min: number, max: number, label: string) =>
  z.preprocess(
    emptyToNull,
    z.coerce.number({ error: `${label} must be a number.` }).int(`${label} must be a whole number.`).min(min, `${label} must be at least ${min}.`).max(max, `${label} is too large.`).nullable(),
  );

const optionalPositiveCm = (label: string) =>
  z.preprocess(
    emptyToNull,
    z.coerce.number({ error: `${label} must be a number.` }).gt(0, `${label} must be greater than 0.`).max(999999, `${label} is too large.`).nullable(),
  );

const uuidOrNull = z.preprocess(emptyToNull, z.uuid().nullable());

export const variantInputSchema = z.object({
  id: uuidOrNull,
  title: z.string().trim().min(1, "Variant name is required.").max(120),
  sku: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : emptyToNull(v)),
    z.string().regex(SKU_RE, "SKU may contain letters, numbers, dot, dash and underscore (max 64).").nullable(),
  ),
  option_values: z.record(z.string().trim().min(1).max(40), z.string().trim().min(1).max(60)).default({}),
  price_override_idr: optionalInt(0, 1_000_000_000, "Price override"),
  weight_override_grams: optionalInt(1, 500_000, "Weight override"),
  on_hand: z.coerce.number({ error: "Stock must be a number." }).int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(1_000_000),
  low_stock_threshold: z.coerce.number().int().min(0).max(1_000_000).default(5),
});

export const attributeInputSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(80),
  value: z.string().trim().min(1, "Value is required.").max(500),
  unit: optionalText(20),
  is_public: z.boolean().default(true),
});

export const productInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Product name needs at least 3 characters.")
      .max(160, "Product name can have at most 160 characters.")
      .refine((v) => !/[<>]/.test(v), "Product name cannot contain < or >."),
    slug: z.string().trim().toLowerCase().max(180).regex(SLUG_RE, "Use lowercase letters, numbers and single dashes."),
    short_description: optionalText(280),
    description: optionalText(10000),
    category_id: uuidOrNull,
    brand: optionalText(80),
    material: optionalText(200),
    color: optionalText(60),
    tags: z.array(z.string().trim().min(1).max(40)).max(20, "Use at most 20 tags.").default([]),
    base_price_idr: z.coerce.number({ error: "Price must be a number." }).int("Price must be whole rupiah.").min(0, "Price cannot be negative.").max(1_000_000_000),
    compare_at_price_idr: optionalInt(1, 1_000_000_000, "Compare-at price"),
    max_qty_per_order: optionalInt(1, 999, "Max quantity per order"),
    track_inventory: z.boolean().default(true),
    /** UTC ISO strings (the action converts from store-local wall time). */
    publish_at: z.preprocess(emptyToNull, z.iso.datetime({ offset: true }).nullable()),
    unpublish_at: z.preprocess(emptyToNull, z.iso.datetime({ offset: true }).nullable()),
    pickup_address_id: uuidOrNull,
    seo_title: optionalText(120),
    seo_description: optionalText(320),
    specs: z.object({
      weight_grams: optionalInt(1, 500_000, "Weight"),
      length_cm: optionalPositiveCm("Length"),
      width_cm: optionalPositiveCm("Width"),
      height_cm: optionalPositiveCm("Height"),
      packaging_weight_grams: z.preprocess((v) => emptyToNull(v) ?? 0, z.coerce.number().int().min(0, "Packaging weight cannot be negative.").max(100_000)),
      fragile: z.boolean().default(false),
      liquid: z.boolean().default(false),
      restricted_category: z.enum(RESTRICTED_CATEGORIES).default("none"),
      handling_days: z.coerce.number().int().min(0).max(60).default(1),
      care_instructions: optionalText(2000),
      packaging_notes: optionalText(1000),
    }),
    variants: z.array(variantInputSchema).min(1, "Add at least one variant.").max(50, "Use at most 50 variants."),
    attributes: z.array(attributeInputSchema).max(30, "Use at most 30 attributes.").default([]),
  })
  .superRefine((value, ctx) => {
    if (value.publish_at && value.unpublish_at && new Date(value.unpublish_at) <= new Date(value.publish_at)) {
      ctx.addIssue({ code: "custom", path: ["unpublish_at"], message: "Unpublish time must be after the publish time." });
    }
    const skus = value.variants.map((v) => v.sku?.toLowerCase()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Each variant needs a different SKU." });
    }
    const combos = value.variants.map((v) => JSON.stringify(Object.entries(v.option_values).sort()));
    if (new Set(combos).size !== combos.length) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Two variants have the same option values." });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const pickupAddressInputSchema = z.object({
  label: z.string().trim().min(2, "Label needs at least 2 characters.").max(80),
  contact_name: z.string().trim().min(2, "Contact name is required.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid phone number."),
  province: z.string().trim().min(2, "Province is required.").max(80),
  city: z.string().trim().min(2, "City / regency is required.").max(80),
  district: optionalText(80),
  street_address: z.string().trim().min(5, "Street address is required.").max(300),
  postal_code: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().regex(/^[0-9]{5}$/, "Postal code has 5 digits.").nullable(),
  ),
  notes: optionalText(500),
  province_code: optionalText(32),
  city_code: optionalText(32),
  district_code: optionalText(32),
  provider_location_code: optionalText(64),
});

export type PickupAddressInput = z.infer<typeof pickupAddressInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters.").max(80),
  slug: z.string().trim().toLowerCase().max(80).regex(SLUG_RE, "Use lowercase letters, numbers and single dashes."),
});

/** Zod issues -> { "specs.weight_grams": "message" } (first message per path). */
export function issuesToFieldErrors(issues: z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
