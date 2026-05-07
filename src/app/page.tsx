"use client";

import { useQuery } from "@tanstack/react-query";
import { categoryApi, productApi } from "@/services/api";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import TopCategories from "@/components/home/TopCategories";
import { Category } from "@/types/product";

export default function Home() {
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

  const {
    data: categoryCounts = {},
    isLoading: countsLoading,
    isError: countsError,
  } = useQuery<Record<string, number>>({
    queryKey: ["category-counts-all"],
    queryFn: productApi.getCategoryCounts,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const isLoading = categoriesLoading || countsLoading;
  const isError = categoriesError || countsError;

  return (
    <main className="min-h-screen mx-auto">
      <Hero />
      {isError ? (
        <div className="mt-8 flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-gray-500 font-medium">Failed to load content.</p>
          <p className="text-sm text-gray-400">
            Please refresh the page to try again.
          </p>
        </div>
      ) : (
        <>
          <Categories categories={categories} isLoading={isLoading} />
          <hr className="my-8 border-gray-300" />
          <TopCategories
            categories={categories}
            categoryCounts={categoryCounts}
            isLoading={isLoading}
          />
        </>
      )}
    </main>
  );
}
