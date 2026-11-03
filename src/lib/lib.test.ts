import { describe, expect, test } from "bun:test";

import { productInputSchema, slugify } from "@/contracts/catalog";
import { toActionError } from "@/lib/errors";
import { sniffImage } from "@/lib/image-sniff";
import { formatIdr } from "@/lib/money";
import { utcIsoToZonedLocal, zonedLocalToUtcIso } from "@/lib/time";

describe("time zones", () => {
  test("Jakarta wall time converts to UTC (+07:00, no DST)", () => {
    expect(zonedLocalToUtcIso("2026-11-03T14:30", "Asia/Jakarta")).toBe("2026-11-03T07:30:00.000Z");
  });

  test("Jakarta midnight is the previous UTC day", () => {
    expect(zonedLocalToUtcIso("2026-11-04T00:00", "Asia/Jakarta")).toBe("2026-11-03T17:00:00.000Z");
    expect(utcIsoToZonedLocal("2026-11-03T17:00:00.000Z", "Asia/Jakarta")).toBe("2026-11-04T00:00");
    expect(utcIsoToZonedLocal("2026-11-03T16:59:00.000Z", "Asia/Jakarta")).toBe("2026-11-03T23:59");
  });

  test("round trips across zones including DST", () => {
    for (const zone of ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Europe/Amsterdam", "America/New_York"]) {
      for (const local of ["2026-01-15T09:00", "2026-07-15T23:45", "2026-03-29T12:00"]) {
        const utc = zonedLocalToUtcIso(local, zone);
        expect(utc).not.toBeNull();
        expect(utcIsoToZonedLocal(utc, zone)).toBe(local);
      }
    }
  });

  test("rejects invalid input", () => {
    expect(zonedLocalToUtcIso("", "Asia/Jakarta")).toBeNull();
    expect(zonedLocalToUtcIso("2026-02-31T10:00", "Asia/Jakarta")).toBeNull();
    expect(zonedLocalToUtcIso("2026-11-03 10:00", "Asia/Jakarta")).toBeNull();
    expect(zonedLocalToUtcIso("2026-11-03T24:00", "Asia/Jakarta")).toBeNull();
  });
});

describe("money", () => {
  test("formats whole rupiah", () => {
    expect(formatIdr(129000)).toBe("Rp 129.000");
    expect(formatIdr(0)).toBe("Rp 0");
    expect(formatIdr(null)).toBe("—");
  });
});

describe("image sniffing", () => {
  test("detects PNG and reads its size", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    png.set([0, 0, 0x03, 0x20, 0, 0, 0x02, 0x58], 16); // 800 x 600
    expect(sniffImage(png)).toEqual({ mime: "image/png", ext: "png", width: 800, height: 600 });
  });

  test("detects JPEG and reads SOF0 size", () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // APP0, length 4
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x01, 0x90, 0x03, 0, 0, 0, 0, 0, 0, // SOF0 300 x 400
    ]);
    expect(sniffImage(jpeg)).toEqual({ mime: "image/jpeg", ext: "jpg", width: 400, height: 300 });
  });

  test("detects WebP (VP8X)", () => {
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
    webp.set([0x1f, 0x03, 0x00], 24); // width-1 = 799
    webp.set([0x57, 0x02, 0x00], 27); // height-1 = 599
    expect(sniffImage(webp)).toEqual({ mime: "image/webp", ext: "webp", width: 800, height: 600 });
  });

  test("rejects SVG, GIF and spoofed content", () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("GIF89a......"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<?php echo 1; ?>"))).toBeNull();
  });
});

describe("error mapping", () => {
  test("maps publish requirement errors", () => {
    expect(toActionError({ message: "PUBLISH_REQUIREMENTS", details: "image_required,weight_required" })).toMatchObject({
      code: "PUBLISH_REQUIREMENTS",
      problems: ["image_required", "weight_required"],
    });
  });

  test("maps unique SKU conflicts to a field", () => {
    const mapped = toActionError({ code: "23505", message: 'duplicate key value violates unique constraint "product_variants_sku_unique_active"' });
    expect(mapped.code).toBe("CONFLICT");
    expect(mapped.fieldErrors).toHaveProperty("variants");
  });

  test("maps FORBIDDEN", () => {
    expect(toActionError({ message: "FORBIDDEN", code: "42501" }).code).toBe("FORBIDDEN");
  });
});

describe("product input contract", () => {
  const base = {
    title: "Linen Shirt",
    slug: "linen-shirt",
    base_price_idr: "199000",
    specs: { weight_grams: "500", length_cm: "20", width_cm: "12", height_cm: "8", packaging_weight_grams: "" },
    variants: [{ title: "Default", sku: "LIN-1", option_values: {}, on_hand: "10" }],
  };

  test("coerces form strings and nulls empty optionals", () => {
    const parsed = productInputSchema.parse(base);
    expect(parsed.base_price_idr).toBe(199000);
    expect(parsed.specs.weight_grams).toBe(500);
    expect(parsed.specs.packaging_weight_grams).toBe(0);
    expect(parsed.short_description).toBeNull();
    expect(parsed.variants[0]).toMatchObject({ id: null, on_hand: 10, sku: "LIN-1" });
  });

  test("rejects zero weight, negative price and HTML in titles", () => {
    expect(productInputSchema.safeParse({ ...base, specs: { ...base.specs, weight_grams: "0" } }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, base_price_idr: "-1" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, title: "<b>Shirt</b>" }).success).toBe(false);
  });

  test("rejects duplicate SKUs and option combinations", () => {
    const dupSku = { ...base, variants: [{ ...base.variants[0] }, { ...base.variants[0], title: "Other", option_values: { Size: "L" } }] };
    expect(productInputSchema.safeParse(dupSku).success).toBe(false);
    const dupCombo = {
      ...base,
      variants: [
        { title: "A", sku: "A", option_values: { Size: "M" }, on_hand: 1 },
        { title: "B", sku: "B", option_values: { Size: "M" }, on_hand: 1 },
      ],
    };
    expect(productInputSchema.safeParse(dupCombo).success).toBe(false);
  });

  test("slugify", () => {
    expect(slugify("  Kaos Katun Ünik — 100%! ")).toBe("kaos-katun-unik-100");
  });
});
