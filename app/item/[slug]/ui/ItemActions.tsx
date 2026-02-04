"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { SlugProps } from "@/lib/types";

export default function ItemActions({ slug }: SlugProps) {
  const { data, mutate } = useSWR(
    `/api/stats?slug=${slug}`,
    api
  );

  const like = async () => {
    await api("/api/event", {
      method: "POST",
      body: {
        action: "event",
        type: "like",
        itemSlug: slug,
        value: 1
      }
    });

    mutate();
  };

  const unlike = async () => {
    await api("/api/event-remove", {
      method: "POST",
      body: {
        action: "event-remove",
        type: "like",
        itemSlug: slug
      }
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