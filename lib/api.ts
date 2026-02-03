// lib/api.ts
export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    next: { revalidate: 60 }
  });

  if (!res.ok) throw new Error("API error");

  return res.json();
}