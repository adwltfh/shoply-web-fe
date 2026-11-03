import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { resolveStoreMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type StoreRole = "owner" | "manager" | "staff";

export type SellerContext = {
  userId: string;
  email: string | null;
  role: StoreRole;
  store: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    mode: "demo" | "live";
  };
};

type MembershipRow = {
  role: StoreRole;
  store: { id: string; name: string; slug: string; timezone: string; mode: string } | null;
};

/** Verified user id from the session JWT, or null when signed out. */
export const getVerifiedUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

/**
 * Data access layer entry point for every seller page and action: verifies the
 * session and resolves the caller's active store membership. The database still
 * enforces the same rules through RLS and seller_* functions.
 */
export const getSellerContext = cache(async (): Promise<SellerContext> => {
  const user = await getVerifiedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .select("role, store:stores(id, name, slug, timezone, mode)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle<MembershipRow>();

  if (error) throw new Error("Could not load your store membership.");
  if (!data?.store) redirect("/no-access");

  return {
    userId: user.id,
    email: user.email,
    role: data.role,
    store: {
      id: data.store.id,
      name: data.store.name,
      slug: data.store.slug,
      timezone: data.store.timezone,
      mode: resolveStoreMode(data.store.mode),
    },
  };
});

export function canManageCatalog(ctx: SellerContext) {
  return ctx.role === "owner" || ctx.role === "manager";
}
