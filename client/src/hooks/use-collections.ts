import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Collection, type InsertCollection, type InsertCollectionItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// GET /api/collections
export function useCollections() {
  return useQuery<(Collection & { count: number })[]>({
    queryKey: ["/api/collections"],
  });
}

// POST /api/collections
export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (collection: InsertCollection) => {
      const res = await apiRequest("POST", "/api/collections", collection);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });
}

// DELETE /api/collections/:id
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/collections/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });
}

// POST /api/collections/:id/fonts
export function useAddFontToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCollectionItem) => {
      const res = await apiRequest("POST", `/api/collections/${data.collectionId}/fonts`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fonts", { collectionId: variables.collectionId }] });
    },
  });
}

// DELETE /api/collections/:id/fonts/:targetId
export function useRemoveFontFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { collectionId: string, targetType: string, targetId: string }) => {
      await apiRequest("DELETE", `/api/collections/${data.collectionId}/fonts/${encodeURIComponent(data.targetId)}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fonts", { collectionId: variables.collectionId }] });
    },
  });
}
