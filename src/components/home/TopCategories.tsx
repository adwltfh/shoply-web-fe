"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Category } from "@/types/product";

// Static image assets we have — keyed by slug
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  laptops: "/categories-card/electronics.png",
  smartphones: "/categories-card/electronics.png",
  tablets: "/categories-card/electronics.png",
  fragrances: "/categories-card/fragrances.png",
  groceries: "/categories-card/groceries.png",
  beauty: "/categories-card/beauties.png",
  "skin-care": "/categories-card/beauties.png",
  "kitchen-accessories": "/categories-card/kitchen.png",
  "sports-accessories": "/categories-card/sports.png",
  motorcycle: "/categories-card/motorcycle.png",
  furniture: "/categories-card/furniture.png",
};

const TOP_LIMIT = 4;

interface TopCategoriesProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  isLoading: boolean;
}

export default function TopCategories({
  categories,
  categoryCounts,
  isLoading,
}: TopCategoriesProps) {
  const topCategories = useMemo(() => {
    if (categories.length === 0) return [];
    return [...categories]
      .sort(
        (a, b) => (categoryCounts[b.slug] ?? 0) - (categoryCounts[a.slug] ?? 0),
      )
      .slice(0, TOP_LIMIT);
  }, [categories, categoryCounts]);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-semibold text-gray-800">Top Categories</p>
        <Link
          href="/categories"
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
                <div className="h-3 w-3/4 mx-auto rounded bg-gray-100 animate-pulse" />
              </div>
            ))
          : topCategories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {/* Rank badge — top-left, low opacity */}
                  <div className="absolute top-2 left-2 z-10 select-none bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-sm font-black text-white/70 leading-none">
                      #{i + 1}
                    </span>
                  </div>

                  {CATEGORY_IMAGE_MAP[cat.slug] ? (
                    <Image
                      src={CATEGORY_IMAGE_MAP[cat.slug]}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 25vw, 160px"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                      <span className="text-2xl text-orange-200 font-bold uppercase">
                        {cat.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-800 text-center group-hover:text-orange-500 transition-colors truncate w-full">
                  {cat.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
