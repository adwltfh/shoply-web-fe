import api from "@/lib/axios";
import { Category, Product } from "@/types/product";

export const productApi = {
  getAll: async (offset = 0, limit = 10): Promise<Product[]> => {
    const { data } = await api.get<Product[]>("/products", {
      params: { offset, limit },
    });
    return data;
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
};
