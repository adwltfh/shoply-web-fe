"use server";

import { revalidatePath } from "next/cache";

import { categoryInputSchema, issuesToFieldErrors, pickupAddressInputSchema } from "@/contracts/catalog";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { toActionError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORBIDDEN = { ok: false as const, code: "FORBIDDEN" as const, message: "Your role does not allow this action." };

export async function savePickupAddress(addressId: string | null, raw: unknown): Promise<ActionResult> {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) return FORBIDDEN;
  if (addressId !== null && !UUID_RE.test(addressId)) return { ok: false, code: "NOT_FOUND", message: "Address not found." };

  const parsed = pickupAddressInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Some fields need attention.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_save_pickup_address", {
    p_store_id: ctx.store.id,
    p_address_id: addressId,
    p_payload: parsed.data,
  });
  if (error) return { ok: false, ...toActionError(error) };
  revalidatePath("/settings/pickup-addresses");
  return { ok: true };
}

export async function setDefaultPickupAddress(addressId: string): Promise<ActionResult> {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) return FORBIDDEN;
  if (!UUID_RE.test(addressId)) return { ok: false, code: "NOT_FOUND", message: "Address not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_set_default_pickup_address", { p_address_id: addressId });
  if (error) return { ok: false, ...toActionError(error) };
  revalidatePath("/settings/pickup-addresses");
  return { ok: true };
}

export async function setPickupAddressActive(addressId: string, active: boolean): Promise<ActionResult> {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) return FORBIDDEN;
  if (!UUID_RE.test(addressId)) return { ok: false, code: "NOT_FOUND", message: "Address not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_set_pickup_address_active", { p_address_id: addressId, p_active: active === true });
  if (error) return { ok: false, ...toActionError(error) };
  revalidatePath("/settings/pickup-addresses");
  return { ok: true };
}

export async function saveCategory(categoryId: string | null, raw: unknown): Promise<ActionResult> {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) return FORBIDDEN;
  if (categoryId !== null && !UUID_RE.test(categoryId)) return { ok: false, code: "NOT_FOUND", message: "Category not found." };

  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Some fields need attention.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_save_category", {
    p_store_id: ctx.store.id,
    p_category_id: categoryId,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });
  if (error) return { ok: false, ...toActionError(error) };
  revalidatePath("/categories");
  return { ok: true };
}
