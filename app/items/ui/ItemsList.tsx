"use client";

import { useItems } from "@/lib/hooks/useItems";
import ItemCard from "./ItemCard";
import Pagination from "./Pagination";

export default function ItemsList() {
  const { items, stats, pagination, isLoading, error } = useItems();

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Failed to load items</div>;
  if (!items.length) return <div>No items found</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            stats={stats[item.id]}
          />
        ))}
      </div>

      {pagination && <Pagination {...pagination} />}
    </div>
  );
}