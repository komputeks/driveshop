import type { ApiResponse } from "@/lib/types";

export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error || "API request failed",
    };
  }

  return json as ApiResponse<T>;
}