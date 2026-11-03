// Maps Postgres/PostgREST errors raised by the seller_* functions to the
// predictable API error codes from the spec and to seller-readable messages.

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PUBLISH_REQUIREMENTS"
  | "INVALID_TRANSITION"
  | "UNKNOWN";

export type ActionError = {
  code: ApiErrorCode;
  message: string;
  /** Publish requirement codes, when code === PUBLISH_REQUIREMENTS. */
  problems?: string[];
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? object : { data: T })) | ({ ok: false } & ActionError);

export const PUBLISH_PROBLEM_LABELS: Record<string, { label: string; field: string }> = {
  category_required: { label: "Choose a category.", field: "category_id" },
  price_required: { label: "Set a price above Rp 0.", field: "base_price_idr" },
  image_required: { label: "Upload at least one product photo.", field: "images" },
  weight_required: { label: "Enter the shipping weight in grams.", field: "specs-weight_grams" },
  dimensions_required: { label: "Enter length, width and height in centimetres.", field: "specs-length_cm" },
  pickup_address_required: { label: "Add an active pickup address (or set a store default).", field: "pickup_address_id" },
  variant_required: { label: "Add at least one variant.", field: "variants" },
  prohibited_item: { label: "Prohibited goods cannot be listed.", field: "specs-restricted_category" },
  unpublish_in_past: { label: "The unpublish time is already in the past.", field: "unpublish_at" },
};

const CONSTRAINT_MESSAGES: Record<string, { message: string; field?: string }> = {
  products_store_id_slug_key: { message: "Another product already uses this URL slug.", field: "slug" },
  product_variants_sku_unique_active: { message: "This SKU is already used by another active variant in your store.", field: "variants" },
  product_variants_options_unique_active: { message: "Two variants have the same option values.", field: "variants" },
  categories_store_id_slug_key: { message: "Another category already uses this slug.", field: "slug" },
  inventory_check: { message: "Stock cannot be lower than the quantity already reserved by orders.", field: "variants" },
  products_check: { message: "The unpublish time must be after the publish time.", field: "unpublish_at" },
};

type PgLikeError = { message?: string; details?: string | null; code?: string; hint?: string | null };

export function toActionError(error: PgLikeError | null | undefined): ActionError {
  const message = error?.message ?? "";
  const details = error?.details ?? "";

  if (message === "UNAUTHORIZED" || error?.code === "28000") {
    return { code: "UNAUTHORIZED", message: "Your session has ended. Please sign in again." };
  }
  if (message === "FORBIDDEN" || error?.code === "42501") {
    return { code: "FORBIDDEN", message: "Your role does not allow this action." };
  }
  if (message === "NOT_FOUND" || error?.code === "P0002") {
    return { code: "NOT_FOUND", message: "This record no longer exists or you cannot access it." };
  }
  if (message === "PUBLISH_REQUIREMENTS") {
    const problems = details.split(",").map((p) => p.trim()).filter(Boolean);
    return { code: "PUBLISH_REQUIREMENTS", message: "This product is missing information required for publishing.", problems };
  }
  if (message === "INVALID_TRANSITION") {
    return { code: "INVALID_TRANSITION", message: details || "That status change is not allowed." };
  }
  if (message.startsWith("VALIDATION_ERROR")) {
    const text = details || message.replace(/^VALIDATION_ERROR:?\s*/, "");
    return { code: "VALIDATION_ERROR", message: text || "Some values are invalid." };
  }

  for (const [constraint, mapped] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (message.includes(constraint)) {
      return {
        code: error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR",
        message: mapped.message,
        fieldErrors: mapped.field ? { [mapped.field]: mapped.message } : undefined,
      };
    }
  }
  if (error?.code === "23514" || error?.code === "22P02" || error?.code === "23502") {
    return { code: "VALIDATION_ERROR", message: "Some values are outside the allowed range." };
  }
  return { code: "UNKNOWN", message: "Something went wrong. Please try again." };
}
