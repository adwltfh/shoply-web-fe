"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { productApi } from "@/services/api";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";

const PAGE_SIZE = 12;

export default function BrandPage() {
  const { brand: rawBrand } = useParams<{ brand: string }>();
  const brand = decodeURIComponent(rawBrand ?? "");
  const router = useRouter();
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["brand-products", brand, skip],
    queryFn: () => productApi.getByBrand(brand, skip, PAGE_SIZE),
    enabled: !!brand,
  });

  const products: Product[] = data?.products ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{brand}</h1>
          {!isLoading && (
            <p className="text-xs text-gray-400 mt-0.5">{total} products</p>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-full aspect-square rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No products found for this brand.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={skip === 0}
            onClick={() => {
              setSkip((s) => Math.max(0, s - PAGE_SIZE));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-orange-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={skip + PAGE_SIZE >= total}
            onClick={() => {
              setSkip((s) => s + PAGE_SIZE);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-orange-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
