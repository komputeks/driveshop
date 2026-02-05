"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { SlugProps, CommentsResponse } from "@/lib/types";

const fetchComments = async (url: string): Promise<CommentsResponse> => {
  return api<CommentsResponse>(url);
};

export default function ItemComments({ slug }: SlugProps) {
  const { data, mutate } = useSWR<CommentsResponse>(
    `/api/item-events?type=comment&slug=${slug}`,
    fetchComments
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

  const events = data?.events ?? [];

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
        {events.map(c => (
          <div key={c.id} className="border rounded p-3">
            <div className="text-sm text-gray-500">
              {c.userName || c.userEmail || "Anonymous"}
            </div>
            <div>{c.value}</div>
          </div>
        ))}

        {!events.length && (
          <div className="text-sm text-gray-400">
            No comments yet
          </div>
        )}
      </div>
    </div>
  );
}