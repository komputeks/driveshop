import useSWR from "swr";
import { api } from "@/lib/api";

export function useCategories() {
  const { data, error, isLoading } = useSWR(
    "/api/categories",
    api
  );

  return {
    categories: data ?? [],
    isLoading,
    error
  };
}