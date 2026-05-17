"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { productApi, categoryApi } from "@/services/api";
import ProductCard from "@/components/ProductCard";
import { Category, Product } from "@/types/product";

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products-list", search, activeCategory, skip],
    queryFn: async () => {
      if (search.trim())
        return productApi.search(search.trim(), skip, PAGE_SIZE);
      if (activeCategory)
        return productApi.getByCategorySlug(activeCategory, skip, PAGE_SIZE);
      return productApi.getProducts(skip, PAGE_SIZE);
    },
  });

  const products: Product[] = (data as any)?.products ?? [];
  const total: number = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug);
    setSearch("");
    setSkip(0);
  };

  return (
    <div className="min-h-screen py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">All Products</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveCategory(null);
            setSkip(0);
          }}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !activeCategory && !search
              ? "bg-orange-500 text-white border-orange-500"
              : "border-gray-200 text-gray-600 hover:border-orange-300"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              activeCategory === cat.slug
                ? "bg-orange-500 text-white border-orange-500"
                : "border-gray-200 text-gray-600 hover:border-orange-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
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
          No products found.
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
            onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-orange-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={skip + PAGE_SIZE >= total}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-orange-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
