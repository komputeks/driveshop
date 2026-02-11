// app/page.tsx

import { ItemsGrid } from "@/components/ItemsGrid";
import { apiFetchServer } from "@/lib/typedFetch";
import type { Item } from "@/lib/types";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await apiFetchServer<{
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    items: Item[];
  }>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "items.list",
      page: 1,
      limit: 50,
    }),
    action: "items.list",
  });

  if ("__overlay" in res) {
    return null; // overlay handles it
  }

  return <ItemsGrid items={res.data.items} />;
}