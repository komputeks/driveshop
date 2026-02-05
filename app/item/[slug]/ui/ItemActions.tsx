"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { ItemStatsResponse, SlugProps } from "@/lib/types";

const fetchStats = async (url: string): Promise<ItemStatsResponse> => {
  return api<ItemStatsResponse>(url);
};

export default function ItemActions({ slug }: SlugProps) {
  const { data, mutate } = useSWR<ItemStatsResponse>(
    `/api/stats?slug=${slug}`,
    fetchStats
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

  const { likes, views, comments } = data.stats;

  return (
    <div className="flex items-center gap-6">
      <button
        onClick={like}
        className="px-3 py-1 border rounded"
      >
        ❤️ {likes}
      </button>

      <span className="text-sm text-gray-500">
        👁 {views}
      </span>

      <span className="text-sm text-gray-500">
        💬 {comments}
      </span>
    </div>
  );
}