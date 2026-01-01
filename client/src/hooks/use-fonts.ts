import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertFavorite, type InsertCollectionItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// GET /api/fonts
export function useFonts(filters?: {
  q?: string;
  categoryId?: string;
  collectionId?: string;
  favorites?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["/api/fonts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.q) params.append("q", filters.q);
      if (filters?.categoryId) params.append("categoryId", filters.categoryId);
      if (filters?.collectionId) params.append("collectionId", filters.collectionId);
      if (filters?.favorites) params.append("favorites", filters.favorites);
      if (filters?.sort) params.append("sort", filters.sort);
      
      const res = await fetch(`/api/fonts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch fonts");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// GET /api/fonts/:family
export function useFont(family: string) {
  return useQuery({
    queryKey: ["/api/fonts", family],
    queryFn: async () => {
      const res = await fetch(`/api/fonts/${encodeURIComponent(family)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch font details");
      return res.json();
    },
    enabled: !!family,
  });
}

// POST /api/rescan
export function useRescanFonts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rescan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fonts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

// POST /api/favorites/toggle
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFavorite) => {
      const res = await apiRequest("POST", "/api/favorites/toggle", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fonts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fonts"] });
    },
  });
}
