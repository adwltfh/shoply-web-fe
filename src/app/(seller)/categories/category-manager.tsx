"use client";

import { useState, useTransition } from "react";

import { slugify } from "@/contracts/catalog";
import { Button, Card, EmptyState, Field, fieldAria, inputClass, Notice } from "@/components/ui";
import type { CategoryRow } from "@/lib/catalog/queries";

import { saveCategory } from "../settings/actions";

export function CategoryManager({ categories, canManage }: { categories: CategoryRow[]; canManage: boolean }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const open = (category: CategoryRow | null) => {
    setErrors({});
    setMessage(null);
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setEditing(category?.id ?? "new");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const target = editing;
    if (!target) return;
    startTransition(async () => {
      const result = await saveCategory(target === "new" ? null : target, { name, slug });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ tone: "danger", text: result.message });
        return;
      }
      setEditing(null);
      setMessage({ tone: "success", text: "Category saved." });
    });
  };

  return (
    <div className="max-w-2xl space-y-4">
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Products need a category before they can be published." />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="font-mono text-xs text-ink-2">{c.slug}</p>
              </div>
              {canManage ? (
                <Button size="sm" variant="ghost" onClick={() => open(c)} disabled={pending}>
                  Rename
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage && editing === null ? <Button onClick={() => open(null)}>Add category</Button> : null}

      {editing ? (
        <Card title={editing === "new" ? "New category" : "Rename category"}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field id="cat-name" label="Name" required error={errors.name}>
              <input
                {...fieldAria("cat-name", errors.name)}
                className={inputClass}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (editing === "new") setSlug(slugify(e.target.value));
                }}
              />
            </Field>
            <Field id="cat-slug" label="Slug" required error={errors.slug}>
              <input {...fieldAria("cat-slug", errors.slug)} className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Saving…" : "Save category"}
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
