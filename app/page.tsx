// app/page.tsx

import { ItemsGrid } from "@/components/itemsGrid";
import { apiFetchServer } from "@/lib/typedFetch";
import type { ItemsListResponse } from "@/lib/types";

type ItemsListData = ItemsListResponse extends { ok: true; data: infer D }
  ? D
  : never;

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await apiFetchServer<ItemsListData>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    action: "items.list", // ✅ REQUIRED by typedFetch
    body: JSON.stringify({
      action: "items.list",
      page: 1,
      limit: 40,
    }),
  }); // ✅ removed trailing comma

  if ("__overlay" in res) {
    return null;
  }

  const items = res.data.items;

  return (
    <>
      <pre>{JSON.stringify(items, null, 2)}</pre>
      <ItemsGrid items={items} />
    </>
  );
}