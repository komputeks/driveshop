// app/page.tsx

import { ItemsGrid } from "@/components/itemsGrid";
import { apiFetchServer } from "@/lib/typedFetch";
import type { ItemsListResponse } from "@/lib/types";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await apiFetchServer<ItemsListResponse["data"]>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "items.list",
      payload: {
        page: 1,
        limit: 40,
      },
    }),
    action: "items.list",
    payload: {
      page: 1,
      limit: 40,
    },
    next: {
      tags: ["items"],
    },
  });

  // If overlay was returned, render nothing (overlay handles UI)
  if ("__overlay" in res) {
    return null;
  }

  const { items } = res.data;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        Latest Items
      </h1>

      <ItemsGrid items={items} />
    </main>
  );
}
