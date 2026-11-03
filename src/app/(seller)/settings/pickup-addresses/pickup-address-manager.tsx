"use client";

import { useState, useTransition } from "react";

import { Button, Card, EmptyState, Field, fieldAria, inputClass, Notice } from "@/components/ui";
import type { PickupAddressRow } from "@/lib/catalog/queries";

import { savePickupAddress, setDefaultPickupAddress, setPickupAddressActive } from "../actions";

const FIELDS = [
  { key: "label", label: "Label", required: true, hint: "e.g. Main Warehouse" },
  { key: "contact_name", label: "Contact name", required: true },
  { key: "phone", label: "Phone", required: true, hint: "Seller-only" },
  { key: "province", label: "Province", required: true },
  { key: "city", label: "City / regency", required: true },
  { key: "district", label: "District / subdistrict" },
  { key: "street_address", label: "Street, building", required: true, wide: true },
  { key: "postal_code", label: "Postal code" },
  { key: "notes", label: "Notes", wide: true },
] as const;

type FormValues = Record<(typeof FIELDS)[number]["key"], string>;

const empty: FormValues = { label: "", contact_name: "", phone: "", province: "", city: "", district: "", street_address: "", postal_code: "", notes: "" };

function toValues(a: PickupAddressRow): FormValues {
  return {
    label: a.label,
    contact_name: a.contact_name,
    phone: a.phone,
    province: a.province,
    city: a.city,
    district: a.district ?? "",
    street_address: a.street_address,
    postal_code: a.postal_code ?? "",
    notes: a.notes ?? "",
  };
}

export function PickupAddressManager({ addresses, canManage }: { addresses: PickupAddressRow[]; canManage: boolean }) {
  const [editing, setEditing] = useState<string | "new" | null>(addresses.length === 0 && canManage ? "new" : null);
  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const open = (address: PickupAddressRow | null) => {
    setErrors({});
    setMessage(null);
    setValues(address ? toValues(address) : empty);
    setEditing(address ? address.id : "new");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const target = editing;
    if (!target) return;
    const original = target === "new" ? null : addresses.find((a) => a.id === target);
    startTransition(async () => {
      const result = await savePickupAddress(target === "new" ? null : target, {
        ...values,
        // Provider location codes are set in the shipping phase; keep any existing ones.
        province_code: original?.province_code ?? "",
        city_code: original?.city_code ?? "",
        district_code: original?.district_code ?? "",
        provider_location_code: original?.provider_location_code ?? "",
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ tone: "danger", text: result.message });
        return;
      }
      setEditing(null);
      setMessage({ tone: "success", text: target === "new" ? "Address added." : "Address saved." });
    });
  };

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, success: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? { tone: "success", text: success } : { tone: "danger", text: result.message ?? "Action failed." });
    });
  };

  return (
    <div className="space-y-5" aria-busy={pending}>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      {addresses.length === 0 && editing !== "new" ? <EmptyState title="No pickup address yet" description="Products cannot be published until the store has an active pickup address." /> : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{a.label}</p>
                <p className="text-sm text-ink-2">
                  {a.city}, {a.province}
                </p>
              </div>
              <div className="flex gap-1.5">
                {a.is_default ? <span className="rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Default</span> : null}
                {!a.active ? <span className="rounded-full border border-line-strong bg-canvas px-2 py-0.5 text-xs font-medium text-ink-2">Inactive</span> : null}
              </div>
            </div>
            <p className="mt-2 text-sm">{a.street_address}</p>
            <p className="text-sm text-ink-2">
              {a.contact_name} · {a.phone}
            </p>
            {canManage ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => open(a)} disabled={pending}>
                  Edit
                </Button>
                {!a.is_default && a.active ? (
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setDefaultPickupAddress(a.id), `${a.label} is now the default.`)}>
                    Make default
                  </Button>
                ) : null}
                {!a.is_default ? (
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setPickupAddressActive(a.id, !a.active), a.active ? "Address deactivated." : "Address activated.")}>
                    {a.active ? "Deactivate" : "Activate"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage && editing === null ? (
        <Button onClick={() => open(null)}>Add pickup address</Button>
      ) : null}

      {editing ? (
        <Card title={editing === "new" ? "New pickup address" : "Edit pickup address"} description={editing === "new" && addresses.some((a) => a.is_default) ? "New addresses are not made default automatically." : undefined}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {FIELDS.map((f) => (
              <Field key={f.key} id={`addr-${f.key}`} label={f.label} required={"required" in f && f.required} hint={"hint" in f ? f.hint : undefined} error={errors[f.key]} className={"wide" in f && f.wide ? "sm:col-span-2" : undefined}>
                <input
                  {...fieldAria(`addr-${f.key}`, errors[f.key], "hint" in f)}
                  className={inputClass}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  inputMode={f.key === "phone" ? "tel" : f.key === "postal_code" ? "numeric" : undefined}
                />
              </Field>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Saving…" : "Save address"}
              </Button>
              <Button onClick={() => setEditing(null)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
