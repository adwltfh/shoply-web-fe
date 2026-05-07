import api from "@/lib/axios";
import { Category, Product } from "@/types/product";

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await api.get<{
      products: Product[];
      total: number;
      skip: number;
      limit: number;
    }>("/products");
    return data.products;
  },

  getProducts: async (
    skip = 0,
    limit = 10,
  ): Promise<{
    products: Product[];
    total: number;
    skip: number;
    limit: number;
  }> => {
    const { data } = await api.get<{
      products: Product[];
      total: number;
      skip: number;
      limit: number;
    }>("/products", {
      params: { skip, limit },
    });
    return data;
  },

  getCategoryCounts: async (): Promise<Record<string, number>> => {
    const { data } = await api.get<{ products: Product[]; total: number }>(
      "/products",
      { params: { limit: 0, select: "category" } },
    );
    const counts: Record<string, number> = {};
    for (const p of data.products) {
      const slug = p.category;
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
    }
    return counts;
  },

  getById: async (id: number): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  getByCategory: async (
    categoryId: number,
    offset = 0,
    limit = 10,
  ): Promise<Product[]> => {
    const { data } = await api.get<Product[]>(
      `/categories/${categoryId}/products`,
      {
        params: { offset, limit },
      },
    );
    return data;
  },
};

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>("/products/categories");
    return data;
  },

  getById: async (id: number): Promise<Category> => {
    const { data } = await api.get<Category>(`/products/category/${id}`);
    return data;
  },

  getCountBySlug: async (slug: string): Promise<number> => {
    const { data } = await api.get<{ total: number }>(
      `/products/category/${slug}`,
      { params: { limit: 1, skip: 0 } },
    );
    return data.total;
  },
};
