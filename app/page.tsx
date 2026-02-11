export const dynamic = "force-dynamic";

import { ItemsGrid } from "@/components/itemsGrid";
import { apiFetchServer } from "@/lib/typedFetch";
import type { Item } from "@/lib/types";

type ItemsListData = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  items: Item[];
};

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await apiFetchServer<ItemsListData>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    action: "items.list",
    body: JSON.stringify({
      action: "items.list",
      page: 1,
      limit: 40,
    }),
  });

  if ("__overlay" in res || !res.data) {
    return <div>No data</div>;
  }

  const items = res.data.items ?? [];

  return (
    <>
      <ItemsGrid items={items} />
    </>
  );
}