"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import ItemCard from "@/components/ItemCardi";

export default function ItemsInfinite({
  initialData,
  searchParams
}) {
  const [items, setItems] = useState(initialData.items);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loading, setLoading] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);

  const params = new URLSearchParams(searchParams).toString();

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);

    const nextPage = page + 1;
    const res = await api(
      `/api/items.list?page=${nextPage}&limit=20&${params}`
    );

    setItems(prev => [...prev, ...res.items]);
    setPage(nextPage);
    setHasMore(res.hasMore);
    setLoading(false);
  }

  /* Intersection Observer */
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, hasMore, loading]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div
          ref={loaderRef}
          className="h-16 flex items-center justify-center text-gray-400"
        >
          {loading ? "Loading…" : "Scroll to load more"}
        </div>
      )}
    </>
  );
}