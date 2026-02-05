"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { api } from "@/lib/api";
import { apiWrite } from "@/lib/apiWriter";
import type { ItemStats, EventsListResponse } from "@/lib/types";

type Props = {
  slug: string;
  userEmail?: string;
};

export default function ItemActions({ slug, userEmail }: Props) {
  const { data } = useSWR<EventsListResponse>(
    `/api/item-events?slug=${slug}`,
    api
  );

  const [loading, setLoading] = useState(false);

  const likes = data?.events?.filter(e => e.type === "like" && e.value === "1").length ?? 0;
  const hasLiked = userEmail
    ? data?.events?.some(e => e.type === "like" && e.value === "1" && e.userEmail === userEmail)
    : false;

  const toggleLike = async () => {
    if (!userEmail) return alert("Login required");

    setLoading(true);

    try {
      await apiWrite(
        hasLiked ? "unlike" : "like",
        "/api/events",
        { itemId: slug, userEmail }
      );

      // 🔁 revalidate this item's events
      globalMutate(`/api/item-events?slug=${slug}`);
      globalMutate(`/api/items?slug=${slug}`); // update stats if needed
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={toggleLike}
        disabled={loading}
        className={`px-4 py-2 rounded-xl font-medium transition ${
          hasLiked
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        ❤️ {likes}
      </button>
    </div>
  );
}