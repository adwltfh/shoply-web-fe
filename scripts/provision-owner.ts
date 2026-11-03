// Provisions (or re-activates) a store owner. Server-side only: uses the
// Supabase secret key, which must never be shipped to a browser or app bundle.
//
//   bun run provision:owner --email owner@example.com [--store shoply-demo] [--role owner]
//
// If the auth user does not exist it is created with a random password and an
// email-confirmed flag; set a password afterwards with --password or the
// Supabase dashboard "Send password recovery" action.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    store: { type: "string", default: "shoply-demo" },
    role: { type: "string", default: "owner" },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (e.g. in .env.local).");
  process.exit(1);
}
if (!values.email) {
  console.error("Usage: bun run provision:owner --email you@example.com [--password ...] [--store shoply-demo] [--role owner|manager|staff]");
  process.exit(1);
}
if (!["owner", "manager", "staff"].includes(values.role!)) {
  console.error("--role must be owner, manager or staff");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: store, error: storeError } = await admin.from("stores").select("id, name, mode").eq("slug", values.store!).maybeSingle();
if (storeError || !store) {
  console.error(`Store "${values.store}" not found. Apply migrations and supabase/seed.sql first.`);
  process.exit(1);
}

async function findUserId(email: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

let userId = await findUserId(values.email);
if (!userId) {
  const password = values.password ?? randomBytes(18).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({ email: values.email, password, email_confirm: true });
  if (error || !data.user) {
    console.error(`Could not create user: ${error?.message}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Created auth user ${values.email}.${values.password ? "" : " A random password was set; use --password to choose one."}`);
} else if (values.password) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password: values.password });
  if (error) {
    console.error(`Could not update password: ${error.message}`);
    process.exit(1);
  }
  console.log("Password updated.");
}

const { error: memberError } = await admin
  .from("store_members")
  .upsert({ store_id: store.id, user_id: userId, role: values.role, status: "active" }, { onConflict: "store_id,user_id" });
if (memberError) {
  console.error(`Could not save membership: ${memberError.message}`);
  process.exit(1);
}

console.log(`${values.email} is now ${values.role} of "${store.name}" (${store.mode.toUpperCase()} mode).`);
