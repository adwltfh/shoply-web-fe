"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Product } from "@/types/product";

const TOP_LIMIT = 8;

interface FeaturedBrandsProps {
  products: Product[];
  isLoading: boolean;
}

export default function FeaturedBrands({
  products,
  isLoading,
}: FeaturedBrandsProps) {
  const brands = useMemo(() => {
    if (products.length === 0) return [];
    const countMap: Record<string, number> = {};
    for (const p of products) {
      if (p.brand) countMap[p.brand] = (countMap[p.brand] ?? 0) + 1;
    }
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_LIMIT)
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-semibold text-gray-800">Featured Brands</p>
        <Link
          href="/products"
          className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
        >
          See All
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: TOP_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))
          : brands.map(({ name, count }) => (
              <Link
                key={name}
                href={`/products?brand=${encodeURIComponent(name)}`}
                className="group flex flex-col items-center justify-center gap-1 h-14 rounded-2xl bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-all duration-200 px-3"
              >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-500 transition-colors truncate w-full text-center">
                  {name}
                </span>
                <span className="text-xs text-gray-400">
                  {count} {count === 1 ? "product" : "products"}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
