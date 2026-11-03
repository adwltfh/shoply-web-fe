import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { listCategories } from "@/lib/catalog/queries";

import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" description="The store taxonomy buyers browse in Shoply Mini." />
      <Suspense fallback={<PageSkeleton label="Loading categories…" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const ctx = await getSellerContext();
  const categories = await listCategories(ctx);
  return <CategoryManager categories={categories} canManage={canManageCatalog(ctx)} />;
}
