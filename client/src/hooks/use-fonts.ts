import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertFavorite, type InsertCollectionItem } from "@shared/routes";

// GET /api/fonts
export function useFonts(filters?: {
  q?: string;
  categoryId?: string;
  collectionId?: string;
  favorites?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: [api.fonts.list.path, filters],
    queryFn: async () => {
      const url = buildUrl(api.fonts.list.path);
      const params = new URLSearchParams();
      if (filters?.q) params.append("q", filters.q);
      if (filters?.categoryId) params.append("categoryId", filters.categoryId);
      if (filters?.collectionId) params.append("collectionId", filters.collectionId);
      if (filters?.favorites) params.append("favorites", filters.favorites);
      if (filters?.sort) params.append("sort", filters.sort);
      
      const res = await fetch(`${url}?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fonts");
      return api.fonts.list.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// GET /api/fonts/:family
export function useFont(family: string) {
  return useQuery({
    queryKey: [api.fonts.get.path, family],
    queryFn: async () => {
      // family can contain spaces, need to encode
      const url = buildUrl(api.fonts.get.path, { family: encodeURIComponent(family) });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch font details");
      return api.fonts.get.responses[200].parse(await res.json());
    },
    enabled: !!family,
  });
}

// POST /api/rescan
export function useRescanFonts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.fonts.rescan.path, {
        method: api.fonts.rescan.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rescan fonts");
      return api.fonts.rescan.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fonts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
    },
  });
}

// POST /api/favorites/toggle
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFavorite) => {
      const res = await fetch(api.favorites.toggle.path, {
        method: api.favorites.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return api.favorites.toggle.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fonts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.favorites.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fonts.get.path] });
    },
  });
}
