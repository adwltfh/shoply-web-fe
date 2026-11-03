import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/status-badge";
import { Card, EmptyState, LinkButton, PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { getCatalogSummary } from "@/lib/catalog/queries";
import { formatInZone } from "@/lib/time";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Overview" description="What needs attention in your catalog." />
      <Suspense fallback={<PageSkeleton label="Loading overview…" />}>
        <Overview />
      </Suspense>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 hover:border-line-strong">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Link>
  );
}

async function Overview() {
  const ctx = await getSellerContext();
  const summary = await getCatalogSummary(ctx);

  if (summary.total === 0) {
    return (
      <EmptyState
        title="Add your first product"
        description="Your catalog is empty. Products you publish here appear in Shoply Mini."
        action={canManageCatalog(ctx) ? <LinkButton href="/products/new" variant="primary">Add product</LinkButton> : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active products" value={summary.active} href="/products?status=active" />
        <Stat label="Scheduled" value={summary.scheduled} href="/products?status=scheduled" />
        <Stat label="Drafts" value={summary.draft} href="/products?status=draft" />
        <Stat label="Low stock (active)" value={summary.lowStock.length} href="/products?stock=low" />
      </div>

      <p className="text-sm text-ink-2">Order, payment-review and revenue figures appear here once checkout is connected. Nothing is estimated or simulated on this page.</p>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Low stock">
          {summary.lowStock.length === 0 ? (
            <p className="text-sm text-ink-2">No active product is at or below its low-stock threshold.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {summary.lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/products/${p.id}`} className="truncate hover:underline">
                    {p.title}
                  </Link>
                  <span className="shrink-0 tabular-nums text-warning">{p.available_qty} left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Going live soon">
          {summary.upcoming.length === 0 ? (
            <p className="text-sm text-ink-2">No scheduled products.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {summary.upcoming.map((p) => (
                <li key={p.id} className="py-2">
                  <Link href={`/products/${p.id}`} className="block truncate hover:underline">
                    {p.title}
                  </Link>
                  <span className="text-xs text-ink-2">{formatInZone(p.publish_at, ctx.store.timezone)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent drafts">
          {summary.recentDrafts.length === 0 ? (
            <p className="text-sm text-ink-2">No drafts.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {summary.recentDrafts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/products/${p.id}`} className="truncate hover:underline">
                    {p.title}
                  </Link>
                  <StatusBadge status={p.display_status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
