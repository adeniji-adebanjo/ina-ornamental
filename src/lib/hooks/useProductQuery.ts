import { useQuery } from "@tanstack/react-query";
import { FishProduct } from "@/types";

async function fetchProductsClient(): Promise<FishProduct[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

async function fetchCategoriesClient(): Promise<string[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProductsClient,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesClient,
    staleTime: 10 * 60 * 1000,
  });
}
