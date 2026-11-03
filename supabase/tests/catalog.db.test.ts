import { beforeAll, describe, expect, test } from "bun:test";
import { createTestDb, DEMO_STORE_ID, productPayload, type Actor, type TestDb } from "./support/db";

let db: TestDb;
let owner: Actor;
let manager: Actor;
let staff: Actor;
let outsider: Actor;
let otherOwner: Actor;
let otherStoreId: string;
const anon: Actor = { role: "anon" };

const SEED_TEE = "00000000-0000-4000-8000-000000000301";

async function saveProduct(actor: Actor, payload: object, productId: string | null = null, storeId = DEMO_STORE_ID) {
  const rows = await db.query<{ id: string }>(actor, "select public.seller_save_product($1, $2, $3::jsonb) as id", [
    storeId,
    productId,
    JSON.stringify(payload),
  ]);
  return rows[0].id;
}

async function addImage(actor: Actor, productId: string, file = "main.jpg") {
  await db.query(actor, "select public.seller_add_product_image($1, $2, 'Alt', 800, 800)", [
    productId,
    `${DEMO_STORE_ID}/${productId}/${file}`,
  ]);
}

beforeAll(async () => {
  db = await createTestDb();
  owner = { role: "authenticated", userId: await db.createUser("owner@demo.test") };
  manager = { role: "authenticated", userId: await db.createUser("manager@demo.test") };
  staff = { role: "authenticated", userId: await db.createUser("staff@demo.test") };
  outsider = { role: "authenticated", userId: await db.createUser("outsider@demo.test") };
  otherOwner = { role: "authenticated", userId: await db.createUser("owner@other.test") };
  await db.addMember(DEMO_STORE_ID, owner.userId, "owner");
  await db.addMember(DEMO_STORE_ID, manager.userId, "manager");
  await db.addMember(DEMO_STORE_ID, staff.userId, "staff");
  otherStoreId = await db.createStore("Other Store", "other-store");
  await db.addMember(otherStoreId, otherOwner.userId, "owner");
});

describe("tenancy and access control", () => {
  test("anon cannot read raw seller tables", async () => {
    for (const table of ["stores", "store_members", "products", "pickup_addresses", "inventory", "product_physical_specs", "seller_product_overview"]) {
      expect(await db.error(anon, `select * from public.${table}`)).toContain("permission denied");
    }
  });

  test("anon cannot call seller functions", async () => {
    expect(await db.error(anon, "select public.seller_set_product_status($1, 'publish')", [SEED_TEE])).toContain("permission denied");
  });

  test("signed-in user without membership sees no store data", async () => {
    expect(await db.query(outsider, "select id from public.stores")).toHaveLength(0);
    expect(await db.query(outsider, "select id from public.products")).toHaveLength(0);
    expect(await db.query(outsider, "select id from public.pickup_addresses")).toHaveLength(0);
  });

  test("users cannot grant themselves a store membership", async () => {
    const err = await db.error(outsider, "insert into public.store_members (store_id, user_id, role) values ($1, $2, 'owner')", [
      DEMO_STORE_ID,
      (outsider as { userId: string }).userId,
    ]);
    expect(err).toContain("permission denied");
  });

  test("members see only their own store", async () => {
    const rows = await db.query<{ store_id: string }>(otherOwner, "select store_id from public.products");
    expect(rows.every((r) => r.store_id === otherStoreId)).toBe(true);
    const demoRows = await db.query<{ store_id: string }>(owner, "select store_id from public.products");
    expect(demoRows.length).toBeGreaterThan(0);
    expect(demoRows.every((r) => r.store_id === DEMO_STORE_ID)).toBe(true);
  });

  test("owner can rename the store but cannot switch it to live mode", async () => {
    expect(await db.error(owner, "update public.stores set name = 'Renamed Demo' where id = $1", [DEMO_STORE_ID])).toBeNull();
    expect(await db.error(owner, "update public.stores set mode = 'live' where id = $1", [DEMO_STORE_ID])).toContain("permission denied");
    expect(await db.error(manager, "update public.stores set name = 'Hijack' where id = $1", [DEMO_STORE_ID])).toBeNull();
    const [store] = await db.query<{ name: string; mode: string }>({ role: "postgres" }, "select name, mode from public.stores where id = $1", [DEMO_STORE_ID]);
    expect(store).toEqual({ name: "Renamed Demo", mode: "demo" }); // manager update matched 0 rows
  });

  test("staff can read the catalog but not change it", async () => {
    expect((await db.query(staff, "select id from public.products")).length).toBeGreaterThan(0);
    expect(await db.error(staff, "select public.seller_set_product_status($1, 'archive')", [SEED_TEE])).toContain("FORBIDDEN");
  });

  test("seller of another store cannot mutate this store's product by guessed id", async () => {
    expect(await db.error(otherOwner, "select public.seller_set_product_status($1, 'archive')", [SEED_TEE])).toContain("FORBIDDEN");
    expect(await db.error(otherOwner, "select public.seller_duplicate_product($1)", [SEED_TEE])).toContain("FORBIDDEN");
    expect(
      await db.error(otherOwner, "select public.seller_save_product($1, $2, $3::jsonb)", [
        otherStoreId,
        SEED_TEE,
        JSON.stringify(productPayload({ slug: "everyday-cotton-tee" })),
      ]),
    ).toContain("FORBIDDEN");
  });

  test("seller cannot create a product inside another store", async () => {
    const err = await db.error(otherOwner, "select public.seller_save_product($1, null, $2::jsonb)", [
      DEMO_STORE_ID,
      JSON.stringify(productPayload({ slug: "intrusion" })),
    ]);
    expect(err).toContain("FORBIDDEN");
  });

  test("direct table writes are blocked even for owners", async () => {
    expect(await db.error(owner, "update public.products set status = 'active' where id = $1", [SEED_TEE])).toContain("permission denied");
    expect(await db.error(owner, "update public.inventory set on_hand = 999")).toContain("permission denied");
  });
});

describe("product lifecycle", () => {
  let productId: string;

  test("manager creates a draft with physical attributes and stock", async () => {
    productId = await saveProduct(manager, productPayload());
    const [product] = await db.query<Record<string, unknown>>(owner, "select status, title, base_price_idr from public.products where id = $1", [productId]);
    expect(product).toEqual({ status: "draft", title: "Linen Shirt", base_price_idr: 199000 });

    const [specs] = await db.query<Record<string, unknown>>(owner, "select weight_grams, length_cm::float8 as l, packaging_notes from public.product_physical_specs where product_id = $1", [productId]);
    expect(specs).toEqual({ weight_grams: 500, l: 20, packaging_notes: "Fold in tissue" });

    const variants = await db.query<{ id: string; is_default: boolean; on_hand: number }>(
      owner,
      "select v.id, v.is_default, i.on_hand from public.product_variants v join public.inventory i on i.variant_id = v.id where v.product_id = $1",
      [productId],
    );
    expect(variants).toHaveLength(1);
    expect(variants[0]).toMatchObject({ is_default: true, on_hand: 10 });

    const movements = await db.query(owner, "select reason, delta_on_hand from public.inventory_movements where variant_id = $1", [variants[0].id]);
    expect(movements).toEqual([{ reason: "initial_stock", delta_on_hand: 10 }]);
  });

  test("cannot publish without a main image", async () => {
    const err = await db.error(owner, "select public.seller_set_product_status($1, 'publish')", [productId]);
    expect(err).toContain("PUBLISH_REQUIREMENTS");
    expect(err).toContain("image_required");
    const [{ problems }] = await db.query<{ problems: string[] }>(owner, "select public.seller_product_publish_check($1) as problems", [productId]);
    expect(problems).toEqual(["image_required"]);
  });

  test("images must live under the product's own storage prefix", async () => {
    const err = await db.error(owner, "select public.seller_add_product_image($1, $2, '', null, null)", [
      productId,
      `${otherStoreId}/${productId}/x.jpg`,
    ]);
    expect(err).toContain("does not belong");
  });

  test("draft products are invisible to buyers", async () => {
    expect(await db.query(anon, "select id from public.storefront_products where id = $1", [productId])).toHaveLength(0);
  });

  test("publishing makes the product visible in the storefront without seller-only fields", async () => {
    await addImage(owner, productId);
    const [{ status }] = await db.query<{ status: string }>(owner, "select public.seller_set_product_status($1, 'publish') as status", [productId]);
    expect(status).toBe("active");

    const rows = await db.query<Record<string, unknown>>(anon, "select * from public.storefront_products where id = $1", [productId]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: "Linen Shirt", weight_grams: 500, is_sold_out: false, store_mode: "demo" });
    expect(rows[0]).not.toHaveProperty("packaging_notes");
    expect(rows[0]).not.toHaveProperty("pickup_address_id");

    const variants = await db.query(anon, "select price_idr, available_qty, in_stock from public.storefront_product_variants where product_id = $1", [productId]);
    expect(variants).toEqual([{ price_idr: 199000, available_qty: 10, in_stock: true }]);

    const attributes = await db.query(anon, "select label, value from public.storefront_product_attributes where product_id = $1", [productId]);
    expect(attributes).toEqual([{ label: "Care", value: "Machine wash cold" }]);
  });

  test("slug is locked once published", async () => {
    const err = await db.error(owner, "select public.seller_save_product(null, $1, $2::jsonb)", [
      productId,
      JSON.stringify(productPayload({ slug: "renamed-shirt" })),
    ]);
    expect(err).toContain("slug is locked");
  });

  test("editing a live product cannot remove publish requirements", async () => {
    const payload = productPayload({ specs: { ...productPayload().specs, weight_grams: null } });
    const err = await db.error(owner, "select public.seller_save_product(null, $1, $2::jsonb)", [productId, JSON.stringify(payload)]);
    expect(err).toContain("weight_required");
    const [specs] = await db.query<{ weight_grams: number }>(owner, "select weight_grams from public.product_physical_specs where product_id = $1", [productId]);
    expect(specs.weight_grams).toBe(500); // transaction rolled back
  });

  test("price edits reach the storefront and stock edits are ledgered", async () => {
    const [variant] = await db.query<{ id: string }>(owner, "select id from public.product_variants where product_id = $1 and active", [productId]);
    const payload = productPayload({
      base_price_idr: 179000,
      variants: [{ id: variant.id, title: "Default", sku: "LIN-001", option_values: {}, on_hand: 7, low_stock_threshold: 2 }],
    });
    await saveProduct(owner, payload, productId);
    const [row] = await db.query<{ base_price_idr: number }>(anon, "select base_price_idr from public.storefront_products where id = $1", [productId]);
    expect(row.base_price_idr).toBe(179000);
    const movements = await db.query(owner, "select reason, delta_on_hand from public.inventory_movements where variant_id = $1 order by created_at", [variant.id]);
    expect(movements).toEqual([
      { reason: "initial_stock", delta_on_hand: 10 },
      { reason: "manual_adjustment", delta_on_hand: -3 },
    ]);
  });

  test("stock cannot drop below reserved quantity", async () => {
    const [variant] = await db.query<{ id: string }>(owner, "select id from public.product_variants where product_id = $1 and active", [productId]);
    await db.query({ role: "postgres" }, "update public.inventory set reserved = 5 where variant_id = $1", [variant.id]);
    const payload = productPayload({
      variants: [{ id: variant.id, title: "Default", sku: "LIN-001", option_values: {}, on_hand: 3 }],
    });
    const err = await db.error(owner, "select public.seller_save_product(null, $1, $2::jsonb)", [productId, JSON.stringify(payload)]);
    expect(err).toContain("inventory_check");
    await db.query({ role: "postgres" }, "update public.inventory set reserved = 0 where variant_id = $1", [variant.id]);
  });

  test("inventory ledger is append-only", async () => {
    expect(await db.error({ role: "postgres" }, "delete from public.inventory_movements")).toContain("append-only");
  });

  test("pausing hides the product; archived products cannot be edited until restored", async () => {
    await db.query(owner, "select public.seller_set_product_status($1, 'pause')", [productId]);
    expect(await db.query(anon, "select id from public.storefront_products where id = $1", [productId])).toHaveLength(0);

    await db.query(owner, "select public.seller_set_product_status($1, 'archive')", [productId]);
    const err = await db.error(owner, "select public.seller_save_product(null, $1, $2::jsonb)", [productId, JSON.stringify(productPayload())]);
    expect(err).toContain("Restore an archived product");
    expect(await db.error(owner, "select public.seller_set_product_status($1, 'pause')", [productId])).toContain("INVALID_TRANSITION");

    const [{ status }] = await db.query<{ status: string }>(owner, "select public.seller_set_product_status($1, 'restore') as status", [productId]);
    expect(status).toBe("draft");
  });

  test("duplicate creates a draft without SKUs, stock or images", async () => {
    const [{ id }] = await db.query<{ id: string }>(owner, "select public.seller_duplicate_product($1) as id", [productId]);
    const [copy] = await db.query<Record<string, unknown>>(owner, "select slug, status, title from public.products where id = $1", [id]);
    expect(copy).toEqual({ slug: "linen-shirt-copy", status: "draft", title: "Linen Shirt (copy)" });
    const variants = await db.query(owner, "select v.sku, i.on_hand from public.product_variants v join public.inventory i on i.variant_id = v.id where v.product_id = $1", [id]);
    expect(variants).toEqual([{ sku: null, on_hand: 0 }]);
    expect(await db.query(owner, "select id from public.product_images where product_id = $1", [id])).toHaveLength(0);
  });
});

describe("scheduling", () => {
  test("future publish_at is scheduled and hidden until the window opens", async () => {
    const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const id = await saveProduct(owner, productPayload({ slug: "future-shirt", publish_at: future, variants: [{ title: "Default", sku: "FUT-1", option_values: {}, on_hand: 1 }] }));
    await addImage(owner, id);
    const [{ status }] = await db.query<{ status: string }>(owner, "select public.seller_set_product_status($1, 'publish') as status", [id]);
    expect(status).toBe("scheduled");
    expect(await db.query(anon, "select id from public.storefront_products where id = $1", [id])).toHaveLength(0);

    // Move the window into the past: visible immediately, no cron needed.
    await db.query({ role: "postgres" }, "update public.products set publish_at = now() - interval '1 minute' where id = $1", [id]);
    expect(await db.query(anon, "select id from public.storefront_products where id = $1", [id])).toHaveLength(1);
    const [overview] = await db.query<{ display_status: string }>(owner, "select display_status from public.seller_product_overview where id = $1", [id]);
    expect(overview.display_status).toBe("active");

    await db.query({ role: "postgres" }, "update public.products set unpublish_at = now() - interval '1 second' where id = $1", [id]);
    expect(await db.query(anon, "select id from public.storefront_products where id = $1", [id])).toHaveLength(0);
    const [expired] = await db.query<{ display_status: string }>(owner, "select display_status from public.seller_product_overview where id = $1", [id]);
    expect(expired.display_status).toBe("expired");
  });

  test("unpublish_at must be after publish_at", async () => {
    const err = await db.error(owner, "select public.seller_save_product($1, null, $2::jsonb)", [
      DEMO_STORE_ID,
      JSON.stringify(productPayload({ slug: "bad-window", publish_at: "2026-12-02T00:00:00Z", unpublish_at: "2026-12-01T00:00:00Z", variants: [{ title: "Default", option_values: {}, on_hand: 0 }] })),
    ]);
    expect(err).toContain("check constraint");
  });
});

describe("variants", () => {
  test("variants carry their own SKU, stock and price override; sold out stays visible", async () => {
    const id = await saveProduct(
      owner,
      productPayload({
        slug: "variant-tee",
        variants: [
          { title: "S", sku: "VT-S", option_values: { Size: "S" }, on_hand: 0 },
          { title: "XL", sku: "VT-XL", option_values: { Size: "XL" }, on_hand: 0, price_override_idr: 219000 },
        ],
      }),
    );
    await addImage(owner, id);
    await db.query(owner, "select public.seller_set_product_status($1, 'publish')", [id]);

    const variants = await db.query(anon, "select title, price_idr, in_stock from public.storefront_product_variants where product_id = $1 order by sort_order", [id]);
    expect(variants).toEqual([
      { title: "S", price_idr: 199000, in_stock: false },
      { title: "XL", price_idr: 219000, in_stock: false },
    ]);
    const [product] = await db.query<{ is_sold_out: boolean }>(anon, "select is_sold_out from public.storefront_products where id = $1", [id]);
    expect(product.is_sold_out).toBe(true);
  });

  test("duplicate option combinations and SKUs are rejected", async () => {
    const dupCombo = await db.error(owner, "select public.seller_save_product($1, null, $2::jsonb)", [
      DEMO_STORE_ID,
      JSON.stringify(productPayload({ slug: "dup-combo", variants: [{ title: "A", option_values: { Size: "M" } }, { title: "B", option_values: { Size: "M" } }] })),
    ]);
    expect(dupCombo).toContain("product_variants_options_unique_active");

    const dupSku = await db.error(owner, "select public.seller_save_product($1, null, $2::jsonb)", [
      DEMO_STORE_ID,
      JSON.stringify(productPayload({ slug: "dup-sku", variants: [{ title: "Default", sku: "tee-cot-m", option_values: {} }] })),
    ]);
    expect(dupSku).toContain("product_variants_sku_unique_active");
  });

  test("removed variants are deactivated, not deleted", async () => {
    const id = await saveProduct(owner, productPayload({ slug: "shrink", variants: [{ title: "A", sku: "SH-A", option_values: { C: "A" } }, { title: "B", sku: "SH-B", option_values: { C: "B" } }] }));
    const [first] = await db.query<{ id: string }>(owner, "select id from public.product_variants where product_id = $1 and sku = 'SH-A'", [id]);
    await saveProduct(owner, productPayload({ slug: "shrink", variants: [{ id: first.id, title: "A", sku: "SH-A", option_values: { C: "A" } }] }), id);
    const rows = await db.query(owner, "select sku, active, is_default from public.product_variants where product_id = $1 order by sku", [id]);
    expect(rows).toEqual([
      { sku: "SH-A", active: true, is_default: true },
      { sku: "SH-B", active: false, is_default: false },
    ]);
  });
});

describe("pickup addresses", () => {
  const address = {
    label: "Second Warehouse",
    contact_name: "Ops",
    phone: "+62 812 0000 0001",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    street_address: "Jl. Contoh No. 2",
  };

  test("a second address never silently becomes the default", async () => {
    const [{ id }] = await db.query<{ id: string }>(owner, "select public.seller_save_pickup_address($1, null, $2::jsonb) as id", [DEMO_STORE_ID, JSON.stringify(address)]);
    const [row] = await db.query<{ is_default: boolean }>(owner, "select is_default from public.pickup_addresses where id = $1", [id]);
    expect(row.is_default).toBe(false);

    await db.query(owner, "select public.seller_set_default_pickup_address($1)", [id]);
    const defaults = await db.query<{ id: string }>(owner, "select id from public.pickup_addresses where store_id = $1 and is_default", [DEMO_STORE_ID]);
    expect(defaults.map((d) => d.id)).toEqual([id]);

    expect(await db.error(owner, "select public.seller_set_pickup_address_active($1, false)", [id])).toContain("choose another default");
  });

  test("staff and other stores cannot manage pickup addresses", async () => {
    expect(await db.error(staff, "select public.seller_save_pickup_address($1, null, $2::jsonb)", [DEMO_STORE_ID, JSON.stringify(address)])).toContain("FORBIDDEN");
    expect(await db.error(otherOwner, "select public.seller_save_pickup_address($1, null, $2::jsonb)", [DEMO_STORE_ID, JSON.stringify(address)])).toContain("FORBIDDEN");
  });

  test("buyers never see pickup street addresses", async () => {
    expect(await db.error(anon, "select street_address from public.pickup_addresses")).toContain("permission denied");
  });
});

describe("storage policies", () => {
  test("only catalog managers can upload under their store prefix", async () => {
    const insert = "insert into storage.objects (bucket_id, name) values ('product-images', $1)";
    expect(await db.error(owner, insert, [`${DEMO_STORE_ID}/p/a.jpg`])).toBeNull();
    expect(await db.error(owner, insert, [`${otherStoreId}/p/a.jpg`])).toContain("row-level security");
    expect(await db.error(staff, insert, [`${DEMO_STORE_ID}/p/b.jpg`])).toContain("row-level security");
    expect(await db.error(anon, insert, [`${DEMO_STORE_ID}/p/c.jpg`])).toContain("row-level security");
    expect(await db.error(owner, insert, ["not-a-uuid/p/d.jpg"])).toContain("row-level security");
  });
});
