"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { issuesToFieldErrors, PRODUCT_STATUS_ACTIONS, productInputSchema, type ProductStatusAction } from "@/contracts/catalog";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/catalog/queries";
import { toActionError, type ActionResult } from "@/lib/errors";
import { sniffImage } from "@/lib/image-sniff";
import { createClient } from "@/lib/supabase/server";
import { zonedLocalToUtcIso } from "@/lib/time";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireCatalogManager() {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) {
    return { ctx, denied: { ok: false as const, code: "FORBIDDEN" as const, message: "Your role can view the catalog but not change it." } };
  }
  return { ctx, denied: null };
}

function revalidateProduct(productId?: string) {
  revalidatePath("/products");
  revalidatePath("/dashboard");
  if (productId) revalidatePath(`/products/${productId}`);
}

/**
 * Creates or updates a product. `raw.publish_at` / `raw.unpublish_at` arrive as
 * store-local wall-clock strings ("YYYY-MM-DDTHH:mm") and are converted to UTC
 * using the store's time zone before validation.
 */
export async function saveProduct(productId: string | null, raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { ctx, denied } = await requireCatalogManager();
  if (denied) return denied;
  if (productId !== null && !UUID_RE.test(productId)) return { ok: false, code: "NOT_FOUND", message: "Product not found." };

  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const toUtc = (key: "publish_at" | "unpublish_at") => {
    const value = input[key];
    if (value === "" || value == null) return null;
    const utc = typeof value === "string" ? zonedLocalToUtcIso(value, ctx.store.timezone) : null;
    if (!utc) fieldErrors[key] = "Enter a valid date and time.";
    return utc;
  };
  const candidate = { ...input, publish_at: toUtc("publish_at"), unpublish_at: toUtc("unpublish_at") };

  const parsed = productInputSchema.safeParse(candidate);
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Some fields need attention.",
      fieldErrors: { ...(parsed.success ? {} : issuesToFieldErrors(parsed.error.issues)), ...fieldErrors },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_save_product", {
    p_store_id: ctx.store.id,
    p_product_id: productId,
    p_payload: parsed.data,
  });
  if (error) return { ok: false, ...toActionError(error) };

  const id = data as string;
  revalidateProduct(id);
  return { ok: true, data: { id } };
}

export async function setProductStatus(productId: string, action: ProductStatusAction): Promise<ActionResult<{ status: string }>> {
  const { denied } = await requireCatalogManager();
  if (denied) return denied;
  if (!UUID_RE.test(productId) || !PRODUCT_STATUS_ACTIONS.includes(action)) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Invalid request." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_set_product_status", { p_product_id: productId, p_action: action });
  if (error) return { ok: false, ...toActionError(error) };

  revalidateProduct(productId);
  return { ok: true, data: { status: data as string } };
}

export async function duplicateProduct(productId: string): Promise<ActionResult> {
  const { denied } = await requireCatalogManager();
  if (denied) return denied;
  if (!UUID_RE.test(productId)) return { ok: false, code: "NOT_FOUND", message: "Product not found." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_duplicate_product", { p_product_id: productId });
  if (error) return { ok: false, ...toActionError(error) };

  revalidateProduct();
  redirect(`/products/${data as string}`);
}

export async function uploadProductImage(formData: FormData): Promise<ActionResult> {
  const { ctx, denied } = await requireCatalogManager();
  if (denied) return denied;

  const productId = String(formData.get("productId") ?? "");
  const altText = String(formData.get("altText") ?? "").trim().slice(0, 200);
  const file = formData.get("file");
  if (!UUID_RE.test(productId)) return { ok: false, code: "NOT_FOUND", message: "Product not found." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, code: "VALIDATION_ERROR", message: "Choose an image to upload." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, code: "VALIDATION_ERROR", message: "Images must be 5 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = sniffImage(bytes);
  if (!image) return { ok: false, code: "VALIDATION_ERROR", message: "Only JPEG, PNG or WebP images are accepted." };

  const supabase = await createClient();
  // RLS-scoped read: confirms the product belongs to the caller's store.
  const { data: product } = await supabase.from("products").select("id, store_id").eq("id", productId).eq("store_id", ctx.store.id).maybeSingle();
  if (!product) return { ok: false, code: "NOT_FOUND", message: "Product not found." };

  // Random object name: never derived from the uploaded file name.
  const path = `${ctx.store.id}/${productId}/${randomUUID()}.${image.ext}`;
  const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, bytes, {
    contentType: image.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (upload.error) return { ok: false, code: "UNKNOWN", message: "The image could not be uploaded. Please retry." };

  const { error } = await supabase.rpc("seller_add_product_image", {
    p_product_id: productId,
    p_storage_path: path,
    p_alt_text: altText,
    p_width_px: image.width,
    p_height_px: image.height,
  });
  if (error) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
    return { ok: false, ...toActionError(error) };
  }

  revalidateProduct(productId);
  return { ok: true };
}

export async function deleteProductImage(productId: string, imageId: string): Promise<ActionResult> {
  const { denied } = await requireCatalogManager();
  if (denied) return denied;
  if (!UUID_RE.test(imageId)) return { ok: false, code: "NOT_FOUND", message: "Image not found." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_delete_product_image", { p_image_id: imageId });
  if (error) return { ok: false, ...toActionError(error) };

  // Row is gone; a failed object removal only leaves an orphaned public file.
  await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([data as string]);
  revalidateProduct(productId);
  return { ok: true };
}

export async function setMainProductImage(productId: string, imageId: string): Promise<ActionResult> {
  const { denied } = await requireCatalogManager();
  if (denied) return denied;
  if (!UUID_RE.test(imageId)) return { ok: false, code: "NOT_FOUND", message: "Image not found." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_set_main_product_image", { p_image_id: imageId });
  if (error) return { ok: false, ...toActionError(error) };
  revalidateProduct(productId);
  return { ok: true };
}
