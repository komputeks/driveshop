"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { api } from "@/lib/api";
import { apiWrite } from "@/lib/apiWriter";
import type { EventRow, EventsListResponse } from "@/lib/types";

type Props = {
  slug: string;
  userEmail?: string;
};

export default function ItemComments({ slug, userEmail }: Props) {
  const { data } = useSWR<EventsListResponse>(
    `/api/item-events?slug=${slug}`,
    api
  );

  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  const comments: EventRow[] =
    data?.events?.filter(e => e.type === "comment" && !e.deleted) ?? [];

  const addComment = async () => {
    if (!userEmail) return alert("Login required");
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      await apiWrite("comment", "/api/events", {
        itemId: slug,
        type: "comment",
        value: newComment,
        userEmail,
      });

      setNewComment("");

      globalMutate(`/api/item-events?slug=${slug}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string) => {
    if (!userEmail) return;

    setLoading(true);

    try {
      await apiWrite("delete", "/api/events", {
        itemId: slug,
        type: "comment",
        userEmail,
        eventId: id,
      });

      globalMutate(`/api/item-events?slug=${slug}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* New Comment */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={addComment}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Post
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map(c => (
          <div
            key={c.id}
            className="p-3 border rounded bg-white/5 flex justify-between items-start"
          >
            <div>
              <p className="text-sm">{c.value}</p>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>

            {userEmail === c.userEmail && (
              <button
                onClick={() => deleteComment(c.id)}
                disabled={loading}
                className="text-red-500 text-sm hover:underline ml-4"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}