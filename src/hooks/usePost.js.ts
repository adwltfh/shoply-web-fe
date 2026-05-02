import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsService, Post } from "@/services/postsService";

export const postKeys = {
  all: ["posts"] as const,
  detail: (id: number) => ["posts", id] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postKeys.all,
    queryFn: postsService.getAll,
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postsService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: Omit<Post, "id">) => postsService.create(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
