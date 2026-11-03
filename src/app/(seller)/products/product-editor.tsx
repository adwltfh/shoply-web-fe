"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { RESTRICTED_CATEGORIES, slugify, type ProductStatusAction } from "@/contracts/catalog";
import { StatusBadge } from "@/components/status-badge";
import { Button, Card, cx, Field, fieldAria, inputClass, Notice } from "@/components/ui";
import type { CategoryRow, PickupAddressRow, ProductEditData } from "@/lib/catalog/queries";
import { PUBLISH_PROBLEM_LABELS, type ActionError } from "@/lib/errors";
import { formatIdr } from "@/lib/money";
import { utcIsoToZonedLocal } from "@/lib/time";

import { saveProduct, setProductStatus } from "./actions";
import { ProductImages } from "./product-images";

const MAX_OPTIONS = 3;

type VariantRow = {
  key: string;
  id: string | null;
  values: string[];
  sku: string;
  price_override_idr: string;
  weight_override_grams: string;
  on_hand: string;
  low_stock_threshold: string;
  reserved: number;
};

type AttributeRow = { key: string; label: string; value: string; unit: string; is_public: boolean };

type FormState = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  brand: string;
  material: string;
  color: string;
  tags: string;
  base_price_idr: string;
  compare_at_price_idr: string;
  max_qty_per_order: string;
  track_inventory: boolean;
  publish_at: string;
  unpublish_at: string;
  pickup_address_id: string;
  seo_title: string;
  seo_description: string;
  specs: {
    weight_grams: string;
    length_cm: string;
    width_cm: string;
    height_cm: string;
    packaging_weight_grams: string;
    fragile: boolean;
    liquid: boolean;
    restricted_category: string;
    handling_days: string;
    care_instructions: string;
    packaging_notes: string;
  };
  optionNames: string[];
  variants: VariantRow[];
  attributes: AttributeRow[];
};

const RESTRICTED_LABELS: Record<(typeof RESTRICTED_CATEGORIES)[number], string> = {
  none: "None",
  lithium_battery: "Contains lithium battery",
  flammable: "Flammable",
  aerosol: "Aerosol / pressurised",
  magnetic: "Strong magnet",
  prohibited: "Prohibited (cannot be listed)",
};

let keySeq = 0;
const newKey = () => `k${++keySeq}`;
const str = (v: number | string | null | undefined) => (v == null ? "" : String(v));

function emptyVariant(optionCount: number): VariantRow {
  return { key: newKey(), id: null, values: Array(optionCount).fill(""), sku: "", price_override_idr: "", weight_override_grams: "", on_hand: "0", low_stock_threshold: "5", reserved: 0 };
}

function initialState(product: ProductEditData | null, timezone: string): FormState {
  const optionNames: string[] = [];
  for (const v of product?.variants ?? []) for (const name of Object.keys(v.option_values ?? {})) if (!optionNames.includes(name)) optionNames.push(name);

  return {
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    brand: product?.brand ?? "",
    material: product?.material ?? "",
    color: product?.color ?? "",
    tags: (product?.tags ?? []).join(", "),
    base_price_idr: str(product?.base_price_idr ?? ""),
    compare_at_price_idr: str(product?.compare_at_price_idr),
    max_qty_per_order: str(product?.max_qty_per_order),
    track_inventory: product?.track_inventory ?? true,
    publish_at: utcIsoToZonedLocal(product?.publish_at, timezone),
    unpublish_at: utcIsoToZonedLocal(product?.unpublish_at, timezone),
    pickup_address_id: product?.pickup_address_id ?? "",
    seo_title: product?.seo_title ?? "",
    seo_description: product?.seo_description ?? "",
    specs: {
      weight_grams: str(product?.specs?.weight_grams),
      length_cm: str(product?.specs?.length_cm),
      width_cm: str(product?.specs?.width_cm),
      height_cm: str(product?.specs?.height_cm),
      packaging_weight_grams: str(product?.specs?.packaging_weight_grams ?? 0),
      fragile: product?.specs?.fragile ?? false,
      liquid: product?.specs?.liquid ?? false,
      restricted_category: product?.specs?.restricted_category ?? "none",
      handling_days: str(product?.specs?.handling_days ?? 1),
      care_instructions: product?.specs?.care_instructions ?? "",
      packaging_notes: product?.specs?.packaging_notes ?? "",
    },
    optionNames,
    variants:
      product && product.variants.length > 0
        ? product.variants.map((v) => ({
            key: newKey(),
            id: v.id,
            values: optionNames.map((n) => v.option_values?.[n] ?? ""),
            sku: v.sku ?? "",
            price_override_idr: str(v.price_override_idr),
            weight_override_grams: str(v.weight_override_grams),
            on_hand: str(v.on_hand),
            low_stock_threshold: str(v.low_stock_threshold),
            reserved: v.reserved,
          }))
        : [emptyVariant(0)],
    attributes: (product?.attributes ?? []).map((a) => ({ key: newKey(), label: a.label, value: a.value, unit: a.unit ?? "", is_public: a.is_public })),
  };
}

function toPayload(s: FormState) {
  const names = s.optionNames.map((n) => n.trim());
  return {
    title: s.title,
    slug: s.slug,
    short_description: s.short_description,
    description: s.description,
    category_id: s.category_id,
    brand: s.brand,
    material: s.material,
    color: s.color,
    tags: s.tags.split(",").map((t) => t.trim()).filter(Boolean),
    base_price_idr: s.base_price_idr,
    compare_at_price_idr: s.compare_at_price_idr,
    max_qty_per_order: s.max_qty_per_order,
    track_inventory: s.track_inventory,
    publish_at: s.publish_at,
    unpublish_at: s.unpublish_at,
    pickup_address_id: s.pickup_address_id,
    seo_title: s.seo_title,
    seo_description: s.seo_description,
    specs: s.specs,
    variants: s.variants.map((v) => ({
      id: v.id,
      title: names.length ? v.values.map((x) => x.trim()).join(" / ") || "Variant" : "Default",
      sku: v.sku,
      option_values: Object.fromEntries(names.map((n, i) => [n, v.values[i]?.trim() ?? ""])),
      price_override_idr: v.price_override_idr,
      weight_override_grams: v.weight_override_grams,
      on_hand: v.on_hand,
      low_stock_threshold: v.low_stock_threshold,
    })),
    attributes: s.attributes.map(({ label, value, unit, is_public }) => ({ label, value, unit, is_public })),
  };
}

/** Field error key ("specs.weight_grams") -> element id ("specs-weight_grams"). */
const domId = (key: string) => key.replace(/\./g, "-");

export function ProductEditor({
  product,
  categories,
  pickupAddresses,
  timezone,
  canManage,
}: {
  product: ProductEditData | null;
  categories: CategoryRow[];
  pickupAddresses: PickupAddressRow[];
  timezone: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialState(product, timezone));
  const [saved, setSaved] = useState(() => JSON.stringify(toPayload(state)));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(toPayload(state)) !== saved;
  const slugLocked = Boolean(product?.published_at);
  const isLive = product?.status === "active" || product?.status === "scheduled";
  const readOnly = !canManage || product?.status === "archived";
  const fe = error?.fieldErrors ?? {};
  const variantError = Object.entries(fe).find(([k]) => k.startsWith("variants"))?.[1];
  const attributeError = Object.entries(fe).find(([k]) => k.startsWith("attributes"))?.[1];
  const defaultPickup = pickupAddresses.find((a) => a.is_default && a.active);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (error) summaryRef.current?.focus();
  }, [error]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((s) => ({ ...s, [key]: value }));
  const setSpec = <K extends keyof FormState["specs"]>(key: K, value: FormState["specs"][K]) => setState((s) => ({ ...s, specs: { ...s.specs, [key]: value } }));
  const setVariant = (key: string, patch: Partial<VariantRow>) => setState((s) => ({ ...s, variants: s.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));

  const addOption = () =>
    setState((s) => ({
      ...s,
      optionNames: [...s.optionNames, ""],
      variants: s.variants.map((v) => ({ ...v, values: [...v.values, ""] })),
    }));
  const removeOption = (index: number) =>
    setState((s) => {
      const optionNames = s.optionNames.filter((_, i) => i !== index);
      let variants = s.variants.map((v) => ({ ...v, values: v.values.filter((_, i) => i !== index) }));
      if (optionNames.length === 0) variants = variants.slice(0, 1);
      return { ...s, optionNames, variants };
    });

  const save = (thenAction?: ProductStatusAction) => {
    setError(null);
    setNotice(null);
    const payload = toPayload(state);
    startTransition(async () => {
      const result = await saveProduct(product?.id ?? null, payload);
      if (!result.ok) {
        setError(result);
        return;
      }
      setSaved(JSON.stringify(payload));
      const id = result.data.id;
      if (thenAction) {
        const statusResult = await setProductStatus(id, thenAction);
        if (!statusResult.ok) {
          setError(statusResult);
          return;
        }
        setNotice(statusResult.data.status === "scheduled" ? "Saved and scheduled. It goes live at the publish time." : "Saved and published to Shoply Mini.");
      } else {
        setNotice(isLive ? "Changes saved. Buyers see them on their next catalog load." : "Draft saved.");
      }
      if (!product) router.replace(`/products/${id}`);
      else router.refresh();
    });
  };

  const changeStatus = (action: ProductStatusAction) => {
    if (dirty && !window.confirm("You have unsaved changes. Change the status without saving them?")) return;
    if (action === "archive" && !window.confirm("Archive this product? It will be hidden from buyers. You can restore it later.")) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await setProductStatus(product!.id, action);
      if (!result.ok) setError(result);
      else router.refresh();
    });
  };

  const problems = useMemo(() => {
    if (error?.code === "PUBLISH_REQUIREMENTS") return error.problems ?? [];
    return [];
  }, [error]);

  const input = (key: string, hasHint = false) => ({ ...fieldAria(domId(key), fe[key], hasHint), className: inputClass, disabled: readOnly });

  return (
    <div className="pb-24 lg:pb-0">
      {error ? (
        <div ref={summaryRef} tabIndex={-1} className="mb-4 outline-none">
          <Notice tone="danger" title={error.message}>
            {problems.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5">
                {problems.map((p) => (
                  <li key={p}>
                    <a className="underline" href={`#${PUBLISH_PROBLEM_LABELS[p]?.field ?? ""}`}>
                      {PUBLISH_PROBLEM_LABELS[p]?.label ?? p}
                    </a>
                  </li>
                ))}
              </ul>
            ) : Object.keys(fe).length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5">
                {Object.entries(fe).slice(0, 8).map(([key, message]) => (
                  <li key={key}>
                    <a className="underline" href={`#${domId(key.startsWith("variants") ? "variants" : key.startsWith("attributes") ? "attributes" : key)}`}>
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Notice>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card title="Basic information">
            <div className="grid gap-4">
              <Field id="title" label="Product name" required error={fe.title}>
                <input
                  {...input("title")}
                  value={state.title}
                  maxLength={160}
                  onChange={(e) => {
                    const title = e.target.value;
                    setState((s) => ({ ...s, title, slug: slugTouched || slugLocked ? s.slug : slugify(title) }));
                  }}
                />
              </Field>
              <Field id="slug" label="URL slug" required error={fe.slug} hint={slugLocked ? "Locked after first publish so buyer links keep working." : "Used in the buyer product URL."}>
                <input
                  {...input("slug", true)}
                  value={state.slug}
                  disabled={readOnly || slugLocked}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="category_id" label="Category" required error={fe.category_id} hint={<Link className="underline" href="/categories">Manage categories</Link>}>
                  <select {...input("category_id", true)} value={state.category_id} onChange={(e) => set("category_id", e.target.value)}>
                    <option value="">Choose a category</option>
                    {categories.filter((c) => c.is_active || c.id === state.category_id).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="brand" label="Brand" error={fe.brand}>
                  <input {...input("brand")} value={state.brand} maxLength={80} onChange={(e) => set("brand", e.target.value)} />
                </Field>
              </div>
              <Field id="short_description" label="Short description" error={fe.short_description} hint="Shown on product cards. Max 280 characters.">
                <input {...input("short_description", true)} value={state.short_description} maxLength={280} onChange={(e) => set("short_description", e.target.value)} />
              </Field>
              <Field id="description" label="Full description" error={fe.description} hint="Plain text. Line breaks are kept; HTML is not rendered.">
                <textarea {...input("description", true)} rows={6} value={state.description} maxLength={10000} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="material" label="Material" error={fe.material} hint="e.g. Cotton, oak wood, glass">
                  <input {...input("material", true)} value={state.material} maxLength={200} onChange={(e) => set("material", e.target.value)} />
                </Field>
                <Field id="color" label="Colour" error={fe.color}>
                  <input {...input("color")} value={state.color} maxLength={60} onChange={(e) => set("color", e.target.value)} />
                </Field>
              </div>
              <Field id="tags" label="Tags" error={fe.tags} hint="Separate with commas. Max 20.">
                <input {...input("tags", true)} value={state.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="base_price_idr" label="Price (IDR)" required error={fe.base_price_idr} hint={state.base_price_idr ? formatIdr(Number(state.base_price_idr)) : "Whole rupiah"}>
                <input {...input("base_price_idr", true)} inputMode="numeric" value={state.base_price_idr} onChange={(e) => set("base_price_idr", e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
              <Field id="compare_at_price_idr" label="Compare-at price" error={fe.compare_at_price_idr} hint="Shown struck through only if higher than the price.">
                <input {...input("compare_at_price_idr", true)} inputMode="numeric" value={state.compare_at_price_idr} onChange={(e) => set("compare_at_price_idr", e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
              <Field id="max_qty_per_order" label="Max per order" error={fe.max_qty_per_order} hint="Optional">
                <input {...input("max_qty_per_order", true)} inputMode="numeric" value={state.max_qty_per_order} onChange={(e) => set("max_qty_per_order", e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
            </div>
          </Card>

          <Card
            id="variants"
            title="Variants & stock"
            description={state.optionNames.length ? "Each combination has its own SKU, stock and optional price." : "Single variant. Add options such as size or colour if the product comes in several versions."}
            actions={
              !readOnly && state.optionNames.length < MAX_OPTIONS ? (
                <Button size="sm" onClick={addOption}>
                  Add option
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-4">
              {variantError ? <p className="text-sm font-medium text-danger">{variantError}</p> : null}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={state.track_inventory} disabled={readOnly} onChange={(e) => set("track_inventory", e.target.checked)} />
                Track inventory (recommended)
              </label>
              {state.optionNames.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {state.optionNames.map((name, i) => (
                    <div key={i} className="flex items-end gap-1.5">
                      <Field id={`option-${i}`} label={`Option ${i + 1} name`}>
                        <input
                          id={`option-${i}`}
                          className={cx(inputClass, "w-36")}
                          placeholder={i === 0 ? "Size" : "Colour"}
                          value={name}
                          disabled={readOnly}
                          onChange={(e) => setState((s) => ({ ...s, optionNames: s.optionNames.map((n, j) => (j === i ? e.target.value : n)) }))}
                        />
                      </Field>
                      {!readOnly ? (
                        <Button size="sm" variant="ghost" aria-label={`Remove option ${name || i + 1}`} onClick={() => removeOption(i)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-ink-2">
                    <tr>
                      {state.optionNames.map((n, i) => (
                        <th key={i} scope="col" className="pb-2 pr-2 font-medium">
                          {n || `Option ${i + 1}`}
                        </th>
                      ))}
                      <th scope="col" className="pb-2 pr-2 font-medium">SKU</th>
                      <th scope="col" className="pb-2 pr-2 font-medium">On hand</th>
                      <th scope="col" className="pb-2 pr-2 font-medium">Low at</th>
                      <th scope="col" className="pb-2 pr-2 font-medium">Price override</th>
                      <th scope="col" className="pb-2 pr-2 font-medium">Weight override (g)</th>
                      <th scope="col" className="pb-2"><span className="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.variants.map((v, row) => (
                      <tr key={v.key} className="align-top">
                        {state.optionNames.map((n, i) => (
                          <td key={i} className="py-1 pr-2">
                            <input
                              aria-label={`${n || `Option ${i + 1}`} for variant ${row + 1}`}
                              className={inputClass}
                              value={v.values[i] ?? ""}
                              disabled={readOnly}
                              onChange={(e) => setVariant(v.key, { values: v.values.map((x, j) => (j === i ? e.target.value : x)) })}
                            />
                          </td>
                        ))}
                        <td className="py-1 pr-2">
                          <input aria-label={`SKU for variant ${row + 1}`} className={cx(inputClass, "font-mono")} value={v.sku} maxLength={64} disabled={readOnly} onChange={(e) => setVariant(v.key, { sku: e.target.value })} />
                        </td>
                        <td className="py-1 pr-2">
                          <input aria-label={`Stock on hand for variant ${row + 1}`} className={cx(inputClass, "w-24")} inputMode="numeric" value={v.on_hand} disabled={readOnly} onChange={(e) => setVariant(v.key, { on_hand: e.target.value.replace(/[^0-9]/g, "") })} />
                          {v.reserved > 0 ? <p className="mt-1 text-xs text-ink-2">{v.reserved} reserved</p> : null}
                        </td>
                        <td className="py-1 pr-2">
                          <input aria-label={`Low-stock threshold for variant ${row + 1}`} className={cx(inputClass, "w-20")} inputMode="numeric" value={v.low_stock_threshold} disabled={readOnly} onChange={(e) => setVariant(v.key, { low_stock_threshold: e.target.value.replace(/[^0-9]/g, "") })} />
                        </td>
                        <td className="py-1 pr-2">
                          <input aria-label={`Price override for variant ${row + 1}`} className={cx(inputClass, "w-32")} inputMode="numeric" placeholder="Base price" value={v.price_override_idr} disabled={readOnly} onChange={(e) => setVariant(v.key, { price_override_idr: e.target.value.replace(/[^0-9]/g, "") })} />
                        </td>
                        <td className="py-1 pr-2">
                          <input aria-label={`Weight override for variant ${row + 1}`} className={cx(inputClass, "w-28")} inputMode="numeric" placeholder="Product" value={v.weight_override_grams} disabled={readOnly} onChange={(e) => setVariant(v.key, { weight_override_grams: e.target.value.replace(/[^0-9]/g, "") })} />
                        </td>
                        <td className="py-1 text-right">
                          {!readOnly && state.optionNames.length > 0 && state.variants.length > 1 ? (
                            <Button size="sm" variant="ghost" aria-label={`Remove variant ${row + 1}`} onClick={() => setState((s) => ({ ...s, variants: s.variants.filter((x) => x.key !== v.key) }))}>
                              Remove
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!readOnly && state.optionNames.length > 0 ? (
                <Button size="sm" onClick={() => setState((s) => ({ ...s, variants: [...s.variants, emptyVariant(s.optionNames.length)] }))}>
                  Add variant
                </Button>
              ) : null}
              <p className="text-xs text-ink-2">Changing stock records a manual adjustment in the inventory ledger. Removed variants are deactivated, not deleted, so past orders stay intact.</p>
            </div>
          </Card>

          <Card
            id="attributes"
            title="Attributes & care"
            description="Typed details such as fit, warranty or country of origin. Only public attributes are shown to buyers."
            actions={
              !readOnly ? (
                <Button size="sm" onClick={() => setState((s) => ({ ...s, attributes: [...s.attributes, { key: newKey(), label: "", value: "", unit: "", is_public: true }] }))}>
                  Add attribute
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {attributeError ? <p className="text-sm font-medium text-danger">{attributeError}</p> : null}
              {state.attributes.length === 0 ? <p className="text-sm text-ink-2">No attributes yet.</p> : null}
              {state.attributes.map((a, i) => (
                <div key={a.key} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_90px_auto_auto] sm:items-center">
                  <input aria-label={`Attribute ${i + 1} label`} placeholder="Label" className={inputClass} value={a.label} disabled={readOnly} onChange={(e) => setState((s) => ({ ...s, attributes: s.attributes.map((x) => (x.key === a.key ? { ...x, label: e.target.value } : x)) }))} />
                  <input aria-label={`Attribute ${i + 1} value`} placeholder="Value" className={inputClass} value={a.value} disabled={readOnly} onChange={(e) => setState((s) => ({ ...s, attributes: s.attributes.map((x) => (x.key === a.key ? { ...x, value: e.target.value } : x)) }))} />
                  <input aria-label={`Attribute ${i + 1} unit`} placeholder="Unit" className={inputClass} value={a.unit} disabled={readOnly} onChange={(e) => setState((s) => ({ ...s, attributes: s.attributes.map((x) => (x.key === a.key ? { ...x, unit: e.target.value } : x)) }))} />
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={a.is_public} disabled={readOnly} onChange={(e) => setState((s) => ({ ...s, attributes: s.attributes.map((x) => (x.key === a.key ? { ...x, is_public: e.target.checked } : x)) }))} />
                    Public
                  </label>
                  {!readOnly ? (
                    <Button size="sm" variant="ghost" aria-label={`Remove attribute ${i + 1}`} onClick={() => setState((s) => ({ ...s, attributes: s.attributes.filter((x) => x.key !== a.key) }))}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Search engine listing" description="Optional. Defaults to the product name and short description.">
            <div className="grid gap-4">
              <Field id="seo_title" label="SEO title" error={fe.seo_title}>
                <input {...input("seo_title")} value={state.seo_title} maxLength={120} onChange={(e) => set("seo_title", e.target.value)} />
              </Field>
              <Field id="seo_description" label="SEO description" error={fe.seo_description}>
                <textarea {...input("seo_description")} rows={2} value={state.seo_description} maxLength={320} onChange={(e) => set("seo_description", e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Status & visibility">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {product ? <StatusBadge status={product.display_status} /> : <StatusBadge status="draft" />}
                {dirty ? <span className="text-xs font-medium text-warning">Unsaved changes</span> : null}
              </div>
              {product && product.publish_problems.length > 0 && !isLive ? (
                <div className="text-sm">
                  <p className="font-medium">Before publishing:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-2">
                    {product.publish_problems.map((p) => (
                      <li key={p}>{PUBLISH_PROBLEM_LABELS[p]?.label ?? p}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Field id="publish_at" label="Publish at" error={fe.publish_at} hint={`Optional. Store time (${timezone}). Empty = immediately.`}>
                <input {...input("publish_at", true)} type="datetime-local" value={state.publish_at} onChange={(e) => set("publish_at", e.target.value)} />
              </Field>
              <Field id="unpublish_at" label="Unpublish at" error={fe.unpublish_at} hint="Optional. Hidden from buyers after this time.">
                <input {...input("unpublish_at", true)} type="datetime-local" value={state.unpublish_at} onChange={(e) => set("unpublish_at", e.target.value)} />
              </Field>
              {canManage ? <StatusButtons product={product} pending={pending} dirty={dirty} onSave={save} onStatus={changeStatus} /> : <p className="text-sm text-ink-2">Your role can view products but not edit them.</p>}
            </div>
          </Card>

          <div id="images">{product ? <ProductImages productId={product.id} images={product.images} readOnly={readOnly} /> : <Card title="Photos"><p className="text-sm text-ink-2">Save the draft first, then upload photos.</p></Card>}</div>

          <Card title="Shipping & physical details" description="Required to publish. Used for courier quotes.">
            <div className="grid gap-4">
              <Field id="specs-weight_grams" label="Weight (grams)" required error={fe["specs.weight_grams"]}>
                <input {...input("specs.weight_grams")} inputMode="numeric" value={state.specs.weight_grams} onChange={(e) => setSpec("weight_grams", e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium">
                  Dimensions (cm)<span className="ml-0.5 text-danger" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["length_cm", "width_cm", "height_cm"] as const).map((k) => (
                    <div key={k}>
                      <label htmlFor={`specs-${k}`} className="text-xs text-ink-2">
                        {k === "length_cm" ? "Length" : k === "width_cm" ? "Width" : "Height"}
                      </label>
                      <input {...input(`specs.${k}`)} inputMode="decimal" value={state.specs[k]} onChange={(e) => setSpec(k, e.target.value.replace(/[^0-9.]/g, ""))} />
                    </div>
                  ))}
                </div>
                {fe["specs.length_cm"] || fe["specs.width_cm"] || fe["specs.height_cm"] ? (
                  <p className="mt-1 text-xs font-medium text-danger">{fe["specs.length_cm"] ?? fe["specs.width_cm"] ?? fe["specs.height_cm"]}</p>
                ) : null}
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <Field id="specs-packaging_weight_grams" label="Packaging (g)" error={fe["specs.packaging_weight_grams"]}>
                  <input {...input("specs.packaging_weight_grams")} inputMode="numeric" value={state.specs.packaging_weight_grams} onChange={(e) => setSpec("packaging_weight_grams", e.target.value.replace(/[^0-9]/g, ""))} />
                </Field>
                <Field id="specs-handling_days" label="Handling (days)" error={fe["specs.handling_days"]}>
                  <input {...input("specs.handling_days")} inputMode="numeric" value={state.specs.handling_days} onChange={(e) => setSpec("handling_days", e.target.value.replace(/[^0-9]/g, ""))} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={state.specs.fragile} disabled={readOnly} onChange={(e) => setSpec("fragile", e.target.checked)} /> Fragile
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={state.specs.liquid} disabled={readOnly} onChange={(e) => setSpec("liquid", e.target.checked)} /> Contains liquid
                </label>
              </div>
              <Field id="specs-restricted_category" label="Restricted goods" error={fe["specs.restricted_category"]}>
                <select {...input("specs.restricted_category")} value={state.specs.restricted_category} onChange={(e) => setSpec("restricted_category", e.target.value)}>
                  {RESTRICTED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {RESTRICTED_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="specs-care_instructions" label="Care instructions" error={fe["specs.care_instructions"]}>
                <textarea {...input("specs.care_instructions")} rows={2} value={state.specs.care_instructions} maxLength={2000} onChange={(e) => setSpec("care_instructions", e.target.value)} />
              </Field>
              <Field id="specs-packaging_notes" label="Packaging notes" error={fe["specs.packaging_notes"]} hint="Seller-only. Never shown to buyers.">
                <textarea {...input("specs.packaging_notes", true)} rows={2} value={state.specs.packaging_notes} maxLength={1000} onChange={(e) => setSpec("packaging_notes", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Pickup origin">
            <Field
              id="pickup_address_id"
              label="Ships from"
              error={fe.pickup_address_id}
              hint={<Link className="underline" href="/settings/pickup-addresses">Manage pickup addresses</Link>}
            >
              <select {...input("pickup_address_id", true)} value={state.pickup_address_id} onChange={(e) => set("pickup_address_id", e.target.value)}>
                <option value="">{defaultPickup ? `Store default — ${defaultPickup.label}, ${defaultPickup.city}` : "Store default (none set)"}</option>
                {pickupAddresses.filter((a) => a.active || a.id === state.pickup_address_id).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.city}
                    {a.active ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </Field>
          </Card>
        </div>
      </div>

      {/* Sticky mobile save bar */}
      {canManage && !readOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 py-3 lg:hidden">
          <Button variant="primary" className="w-full" disabled={pending || (!dirty && Boolean(product))} onClick={() => save()}>
            {pending ? "Saving…" : isLive ? "Save changes" : "Save draft"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatusButtons({
  product,
  pending,
  dirty,
  onSave,
  onStatus,
}: {
  product: ProductEditData | null;
  pending: boolean;
  dirty: boolean;
  onSave: (then?: ProductStatusAction) => void;
  onStatus: (action: ProductStatusAction) => void;
}) {
  const status = product?.status;
  if (status === "archived") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink-2">Archived products are hidden and read-only.</p>
        <Button className="w-full" disabled={pending} onClick={() => onStatus("restore")}>
          Restore as draft
        </Button>
      </div>
    );
  }
  const live = status === "active" || status === "scheduled";
  return (
    <div className="space-y-2" aria-busy={pending}>
      <Button variant={live ? "primary" : "secondary"} className="w-full" disabled={pending || (!dirty && Boolean(product))} onClick={() => onSave()}>
        {pending ? "Saving…" : live ? "Save changes" : "Save draft"}
      </Button>
      {!live ? (
        <Button variant="primary" className="w-full" disabled={pending || !product} onClick={() => onSave("publish")} title={product ? undefined : "Save the draft and add a photo first"}>
          {status === "paused" ? "Save & unpause" : "Save & publish"}
        </Button>
      ) : null}
      {product ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {live ? (
            <Button size="sm" disabled={pending} onClick={() => onStatus("pause")}>
              Pause
            </Button>
          ) : null}
          {live || status === "paused" ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => onStatus("unpublish")}>
              Back to draft
            </Button>
          ) : null}
          <Button size="sm" variant="danger" disabled={pending} onClick={() => onStatus("archive")}>
            Archive
          </Button>
        </div>
      ) : null}
    </div>
  );
}
