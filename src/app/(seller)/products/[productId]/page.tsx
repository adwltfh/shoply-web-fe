import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { getProductForEdit, listCategories, listPickupAddresses } from "@/lib/catalog/queries";
import { formatInZone } from "@/lib/time";

import { ProductEditor } from "../product-editor";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage(props: PageProps<"/products/[productId]">) {
  return (
    <Suspense fallback={<PageSkeleton label="Loading product…" />}>
      <EditProduct params={props.params} />
    </Suspense>
  );
}

async function EditProduct({ params }: { params: PageProps<"/products/[productId]">["params"] }) {
  const { productId } = await params;
  const ctx = await getSellerContext();
  const [product, categories, pickupAddresses] = await Promise.all([getProductForEdit(ctx, productId), listCategories(ctx), listPickupAddresses(ctx)]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/products" className="hover:underline">
            Products
          </Link>
        }
        title={product.title}
        description={`Last updated ${formatInZone(product.updated_at, ctx.store.timezone)}`}
      />
      {/* key resets editor state when navigating between products */}
      <ProductEditor key={product.id} product={product} categories={categories} pickupAddresses={pickupAddresses} timezone={ctx.store.timezone} canManage={canManageCatalog(ctx)} />
    </>
  );
}
