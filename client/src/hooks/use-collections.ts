import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCollection, type InsertCollectionItem } from "@shared/routes";

// GET /api/collections
export function useCollections() {
  return useQuery({
    queryKey: [api.collections.list.path],
    queryFn: async () => {
      const res = await fetch(api.collections.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch collections");
      return api.collections.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/collections
export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCollection) => {
      const res = await fetch(api.collections.create.path, {
        method: api.collections.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create collection");
      return api.collections.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.collections.list.path] }),
  });
}

// DELETE /api/collections/:id
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.collections.delete.path, { id });
      const res = await fetch(url, { method: api.collections.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete collection");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.collections.list.path] }),
  });
}

// POST /api/collections/:id/items (Add font to collection)
export function useAddFontToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, ...data }: InsertCollectionItem) => {
      const url = buildUrl(api.collections.addFont.path, { id: collectionId });
      const res = await fetch(url, {
        method: api.collections.addFont.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add font to collection");
      return api.collections.addFont.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collections.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fonts.get.path] });
    },
  });
}

// DELETE /api/collections/:id/items (Remove font)
export function useRemoveFontFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, targetId, targetType }: { collectionId: string, targetId: string, targetType: string }) => {
      const url = buildUrl(api.collections.removeFont.path, { id: collectionId });
      const res = await fetch(url, {
        method: api.collections.removeFont.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove font from collection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collections.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fonts.get.path] });
    },
  });
}
