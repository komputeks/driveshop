"use client";

import useSWR from "swr";
import type { ItemStatsResponse, SlugProps } from "@/lib/types";
import { api } from "@/lib/api";

export default function ItemActions({ slug }: SlugProps) {
  const { data, mutate } = useSWR<ItemStatsResponse>(
    `/api/stats?slug=${slug}`,
    api
  );

  const like = async () => {
    await api("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "event",
        type: "like",
        itemSlug: slug,
        value: 1,
      }),
    });

    mutate();
  };

  const unlike = async () => {
    await api("/api/event-remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "event-remove",
        type: "like",
        itemSlug: slug,
      }),
    });

    mutate();
  };

  if (!data) return null;

  return (
    <div className="flex items-center gap-6">
      <button
        onClick={like}
        className="px-3 py-1 border rounded"
      >
        ❤️ {data.stats.likes}
      </button>

      <span className="text-sm text-gray-500">
        👁 {data.stats.views}
      </span>

      <span className="text-sm text-gray-500">
        💬 {data.stats.comments}
      </span>
    </div>
  );
}