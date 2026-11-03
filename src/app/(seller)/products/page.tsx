import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/status-badge";
import { buttonClass, EmptyState, inputClass, LinkButton, PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { listCategories, listProducts, productImageUrl, type ProductListRow } from "@/lib/catalog/queries";
import { formatIdr } from "@/lib/money";
import { formatInZone } from "@/lib/time";

import { ProductRowActions } from "./product-row-actions";

export const metadata: Metadata = { title: "Products" };

type SearchParams = PageProps<"/products">["searchParams"];

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Create, schedule and manage the listings shown in Shoply Mini."
        actions={
          <Suspense fallback={null}>
            <AddProductButton />
          </Suspense>
        }
      />
      <Suspense fallback={<PageSkeleton label="Loading products…" />}>
        <ProductsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function AddProductButton() {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) return null;
  return (
    <LinkButton href="/products/new" variant="primary">
      Add product
    </LinkButton>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    q: one(params.q),
    status: one(params.status),
    category: one(params.category),
    stock: one(params.stock),
    page: Number(one(params.page)) || 1,
  };
  const ctx = await getSellerContext();
  const [{ rows, total, page, pageSize }, categories] = await Promise.all([listProducts(ctx, filters), listCategories(ctx)]);
  const manage = canManageCatalog(ctx);
  const hasFilters = Boolean(filters.q || filters.status || filters.category || filters.stock);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (target: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (key !== "page" && value) sp.set(key, String(value));
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="space-y-4">
      <form method="get" action="/products" className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search">
        <label className="sr-only" htmlFor="q">
          Search by name or SKU
        </label>
        <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Search name or SKU" className={inputClass} />
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={filters.status} className={inputClass}>
          <option value="">All except archived</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" defaultValue={filters.category} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="stock">
          Stock
        </label>
        <select id="stock" name="stock" defaultValue={filters.stock} className={inputClass}>
          <option value="">Any stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("secondary")}>
            Apply
          </button>
          {hasFilters ? (
            <Link href="/products" className={buttonClass("ghost")}>
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState title="No products match these filters." description="Change or clear the filters to see more products." action={<LinkButton href="/products">Clear filters</LinkButton>} />
        ) : (
          <EmptyState
            title="Add your first product"
            description="Products start as drafts. Publish when photos, price, weight, dimensions and a pickup address are set."
            action={manage ? <LinkButton href="/products/new" variant="primary">Add product</LinkButton> : undefined}
          />
        )
      ) : (
        <>
          <p className="text-sm text-ink-2" aria-live="polite">
            {total} product{total === 1 ? "" : "s"}
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Available</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Updated</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="align-middle hover:bg-canvas/60">
                    <td className="px-4 py-3">
                      <ProductCell row={row} />
                    </td>
                    <td className="px-4 py-3 text-ink-2">{row.category_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatIdr(row.base_price_idr)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <StockCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.display_status} />
                      <ScheduleNote row={row} timezone={ctx.store.timezone} />
                    </td>
                    <td className="px-4 py-3 text-ink-2">{formatInZone(row.updated_at, ctx.store.timezone)}</td>
                    <td className="px-4 py-3 text-right">{manage ? <ProductRowActions productId={row.id} status={row.status} title={row.title} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="space-y-2 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
                <ProductCell row={row} />
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-ink-2">Price</dt>
                    <dd className="tabular-nums">{formatIdr(row.base_price_idr)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-2">Available</dt>
                    <dd className="tabular-nums">
                      <StockCell row={row} />
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="sr-only">Status</dt>
                    <dd>
                      <StatusBadge status={row.display_status} />
                      <ScheduleNote row={row} timezone={ctx.store.timezone} />
                    </dd>
                  </div>
                </dl>
                {manage ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <ProductRowActions productId={row.id} status={row.status} title={row.title} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {pages > 1 ? (
            <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
              <span className="text-ink-2">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? <LinkButton href={pageHref(page - 1)} size="sm">Previous</LinkButton> : null}
                {page < pages ? <LinkButton href={pageHref(page + 1)} size="sm">Next</LinkButton> : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function ProductCell({ row }: { row: ProductListRow }) {
  const src = productImageUrl(row.main_image_path);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
        {src ? <Image src={src} alt="" fill sizes="44px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[0.6rem] text-ink-2">No photo</span>}
      </div>
      <div className="min-w-0">
        <Link href={`/products/${row.id}`} className="block truncate font-medium text-ink hover:underline">
          {row.title}
        </Link>
        <p className="truncate font-mono text-xs text-ink-2">{row.skus || "No SKU"}{row.variant_count > 1 ? ` · ${row.variant_count} variants` : ""}</p>
      </div>
    </div>
  );
}

function StockCell({ row }: { row: ProductListRow }) {
  if (!row.track_inventory) return <span className="text-ink-2">Not tracked</span>;
  if (row.available_qty === 0) return <span className="font-medium text-danger">Out of stock</span>;
  return (
    <span className={row.low_stock ? "font-medium text-warning" : undefined}>
      {row.available_qty}
      {row.low_stock ? " · low" : ""}
    </span>
  );
}

function ScheduleNote({ row, timezone }: { row: ProductListRow; timezone: string }) {
  if (row.display_status === "scheduled" && row.publish_at) {
    return <p className="mt-1 text-xs text-ink-2">Goes live {formatInZone(row.publish_at, timezone)}</p>;
  }
  if (row.unpublish_at && (row.display_status === "active" || row.display_status === "scheduled")) {
    return <p className="mt-1 text-xs text-ink-2">Ends {formatInZone(row.unpublish_at, timezone)}</p>;
  }
  return null;
}
