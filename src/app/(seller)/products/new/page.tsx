import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { listCategories, listPickupAddresses } from "@/lib/catalog/queries";

import { ProductEditor } from "../product-editor";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/products" className="hover:underline">
            Products
          </Link>
        }
        title="New product"
        description="Saved as a draft. Buyers see it only after you publish."
      />
      <Suspense fallback={<PageSkeleton label="Loading editor…" />}>
        <NewProductEditor />
      </Suspense>
    </>
  );
}

async function NewProductEditor() {
  const ctx = await getSellerContext();
  if (!canManageCatalog(ctx)) redirect("/products");
  const [categories, pickupAddresses] = await Promise.all([listCategories(ctx), listPickupAddresses(ctx)]);
  return <ProductEditor product={null} categories={categories} pickupAddresses={pickupAddresses} timezone={ctx.store.timezone} canManage />;
}
