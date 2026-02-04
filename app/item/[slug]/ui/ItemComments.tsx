"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";
import type { Comment, SlugProps } from "@/lib/types";

export default function ItemComments({ slug }: SlugProps) {
  const { data, mutate } = useSWR<CommentsResponse>(
    `/api/item-events?type=comment&slug=${slug}`,
    api
  );

  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;

    await api("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "event",
        type: "comment",
        itemSlug: slug,
        value: text,
      }),
    });

    setText("");
    mutate();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Comments</h2>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 border rounded p-2"
        />
        <button
          onClick={submit}
          className="border rounded px-4"
        >
          Post
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {data?.events?.map(c => (
          <div
            key={c.id}
            className="border rounded p-3"
          >
            <div className="text-sm text-gray-500">
              {c.userName || "Anonymous"}
            </div>
            <div>{c.value}</div>
          </div>
        ))}

        {!data?.events?.length && (
          <div className="text-sm text-gray-400">
            No comments yet
          </div>
        )}
      </div>
    </div>
  );
}