"use client";

import { useMemo } from "react";
import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { Product } from "@/types/product";

const TOP_LIMIT = 4;

interface NewArrivalsProps {
  products: Product[];
  isLoading: boolean;
}

export default function NewArrivals({ products, isLoading }: NewArrivalsProps) {
  const newArrivals = useMemo(() => {
    if (products.length === 0) return [];
    return [...products]
      .sort(
        (a, b) =>
          new Date(b.meta.createdAt).getTime() -
          new Date(a.meta.createdAt).getTime(),
      )
      .slice(0, TOP_LIMIT);
  }, [products]);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold text-gray-800">New Arrivals</p>
          <span className="text-xs font-bold text-white bg-blue-500 rounded-full px-2 py-0.5">
            NEW
          </span>
        </div>
        <Link
          href="/products"
          className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
        >
          See All
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3 items-start">
        {isLoading
          ? Array.from({ length: TOP_LIMIT }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full aspect-square rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
              </div>
            ))
          : newArrivals.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <div className="absolute top-2 left-2 z-10 select-none bg-blue-500 rounded-lg px-2 py-1">
                    <span className="text-xs font-black text-white leading-none">
                      NEW
                    </span>
                  </div>
                  <ProductImage
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 25vw, 160px"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-orange-500 transition-colors truncate w-full">
                  {product.title}
                </span>
                <span className="text-xs font-bold text-orange-500">
                  ${product.price.toFixed(2)}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
