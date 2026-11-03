import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_DIR = join(import.meta.dir, "..", "..");

export const DEMO_STORE_ID = "00000000-0000-4000-8000-000000000001";

export type Actor =
  | { role: "anon" }
  | { role: "authenticated"; userId: string }
  | { role: "service_role" }
  | { role: "postgres" };

export interface TestDb {
  pg: PGlite;
  /** Run one statement as the given actor in its own transaction. */
  query<T = Record<string, unknown>>(actor: Actor, sql: string, params?: unknown[]): Promise<T[]>;
  /** Run one statement and return the error message (or null when it succeeds). */
  error(actor: Actor, sql: string, params?: unknown[]): Promise<string | null>;
  createUser(email: string): Promise<string>;
  addMember(storeId: string, userId: string, role: "owner" | "manager" | "staff"): Promise<void>;
  createStore(name: string, slug: string): Promise<string>;
}

export async function createTestDb({ seed = true } = {}): Promise<TestDb> {
  const pg = new PGlite({ extensions: { pgcrypto } });

  await pg.exec(readFileSync(join(SUPABASE_DIR, "tests", "support", "supabase-stub.sql"), "utf8"));

  const migrationsDir = join(SUPABASE_DIR, "migrations");
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await pg.exec(readFileSync(join(migrationsDir, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  if (seed) {
    await pg.exec(readFileSync(join(SUPABASE_DIR, "seed.sql"), "utf8"));
  }

  async function run<T>(actor: Actor, sql: string, params: unknown[] = []): Promise<T[]> {
    return pg.transaction(async (tx) => {
      if (actor.role !== "postgres") {
        const claims =
          actor.role === "authenticated"
            ? { sub: actor.userId, role: "authenticated" }
            : { role: actor.role };
        await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
        await tx.exec(`set local role ${actor.role}`);
      }
      const result = await tx.query<T>(sql, params);
      return result.rows;
    });
  }

  return {
    pg,
    query: run,
    async error(actor, sql, params) {
      try {
        await run(actor, sql, params);
        return null;
      } catch (error) {
        const e = error as { message: string; detail?: string };
        return e.detail ? `${e.message}: ${e.detail}` : e.message;
      }
    },
    async createUser(email) {
      const rows = await run<{ id: string }>({ role: "postgres" }, "insert into auth.users (email) values ($1) returning id", [email]);
      return rows[0].id;
    },
    async addMember(storeId, userId, role) {
      await run({ role: "postgres" }, "insert into public.store_members (store_id, user_id, role) values ($1, $2, $3)", [
        storeId,
        userId,
        role,
      ]);
    },
    async createStore(name, slug) {
      const rows = await run<{ id: string }>({ role: "postgres" }, "insert into public.stores (name, slug) values ($1, $2) returning id", [
        name,
        slug,
      ]);
      return rows[0].id;
    },
  };
}

/** A complete payload that satisfies every publish requirement except the image. */
export function productPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Linen Shirt",
    slug: "linen-shirt",
    short_description: "Breathable linen shirt",
    description: "Test product",
    category_id: "00000000-0000-4000-8000-000000000102",
    material: "Linen",
    tags: ["summer"],
    base_price_idr: 199000,
    compare_at_price_idr: null,
    track_inventory: true,
    publish_at: null,
    unpublish_at: null,
    pickup_address_id: null,
    specs: {
      weight_grams: 500,
      length_cm: 20,
      width_cm: 12,
      height_cm: 8,
      packaging_weight_grams: 50,
      fragile: false,
      liquid: false,
      restricted_category: "none",
      handling_days: 1,
      packaging_notes: "Fold in tissue",
    },
    variants: [{ title: "Default", sku: "LIN-001", option_values: {}, on_hand: 10, low_stock_threshold: 2 }],
    attributes: [{ label: "Care", value: "Machine wash cold", is_public: true }],
    ...overrides,
  };
}
