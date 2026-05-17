"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/services/api";

export default function BrandsPage() {
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: productApi.getBrands,
  });

  const grouped = useMemo(() => {
    const map: Record<string, { name: string; count: number }[]> = {};
    for (const brand of brands) {
      const letter = brand.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(brand);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [brands]);

  return (
    <main className="pb-12 pt-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">All Brands</h1>
        {!isLoading && (
          <p className="text-sm text-gray-400 mt-0.5">{brands.length} brands</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-5 rounded bg-gray-100 animate-pulse mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([letter, items]) => (
            <section key={letter}>
              <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                {letter}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {items.map(({ name, count }) => (
                  <Link
                    key={name}
                    href={`/brands/${encodeURIComponent(name)}`}
                    className="group flex flex-col justify-center gap-0.5 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all duration-150"
                  >
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-500 transition-colors truncate">
                      {name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
