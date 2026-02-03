import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";

export function useItems() {
  const params = useSearchParams();

  const page = params.get("page") || "1";
  const cat1 = params.get("cat1") || "";
  const cat2 = params.get("cat2") || "";
  const search = params.get("search") || "";

  const qs = new URLSearchParams({
    page,
    ...(cat1 && { cat1 }),
    ...(cat2 && { cat2 }),
    ...(search && { search })
  }).toString();

  const { data, error, isLoading } = useSWR(
    `/api/items?${qs}`,
    api
  );

  return {
    items: data?.items ?? [],
    stats: data?.stats ?? {},
    pagination: data?.pagination,
    isLoading,
    error
  };
}