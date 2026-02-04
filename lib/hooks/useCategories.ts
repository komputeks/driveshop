"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then(res => res.json());

export function useCategories() {
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=categories`,
    fetcher
  );

  return {
    categories: data?.categories || [],
    isLoading,
    isError: error,
  };
}