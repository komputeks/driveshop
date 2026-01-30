// lib/posts.ts

const API = process.env.NEXT_PUBLIC_GAS_URL!;

export async function fetchItems(params?: {
  q?: string;
  category?: string;
}) {
  const url = new URL(API);

  url.searchParams.set("path", "items");

  if (params?.q) {
    url.searchParams.set("q", params.q);
  }

  if (params?.category) {
    url.searchParams.set("cat", params.category);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 }, // ISR cache
  });

  if (!res.ok) throw new Error("Failed to fetch");

  return res.json();
}