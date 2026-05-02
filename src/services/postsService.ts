import api from "@/lib/axios";

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export const postsService = {
  getAll: async (): Promise<Post[]> => {
    const { data } = await api.get<Post[]>("/posts");
    return data;
  },

  getById: async (id: number): Promise<Post> => {
    const { data } = await api.get<Post>(`/posts/${id}`);
    return data;
  },

  create: async (post: Omit<Post, "id">): Promise<Post> => {
    const { data } = await api.post<Post>("/posts", post);
    return data;
  },

  update: async (id: number, post: Partial<Post>): Promise<Post> => {
    const { data } = await api.put<Post>(`/posts/${id}`, post);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};
