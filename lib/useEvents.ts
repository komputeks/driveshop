// lib/useEvents.ts
"use client";

import { useState, useEffect, useCallback } from "react";

type EventType = "like" | "comment";

export interface Comment {
  id: string;
  itemId: string;
  type: EventType;
  value: string; // text for comments, "1" for likes
  pageUrl: string;
  userEmail: string;
  createdAt: string;
}

export interface UseEventsReturn {
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
  addComment: (text: string) => Promise<void>;
  editComment: (id: string, text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  toggleLike: () => Promise<void>;
  loading: boolean;
}

export function useEvents(itemId: string, userEmail?: string): UseEventsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // fetch events from GAS
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/items?itemId=${itemId}`);
      const json = await res.json();
      if (!json.ok) return;

      const itemEvents: Comment[] = json.events || [];

      setComments(itemEvents.filter(e => e.type === "comment" && e.value !== "[deleted]"));
      const likeEvents = itemEvents.filter(e => e.type === "like" && e.value === "1");
      setLikes(likeEvents.length);

      if (userEmail) {
        setHasLiked(likeEvents.some(e => e.userEmail === userEmail));
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }, [itemId, userEmail]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // add/edit/delete comment
  const writeEvent = useCallback(
    async (action: "comment" | "edit" | "delete", value?: string, eventId?: string) => {
      if (!userEmail) throw new Error("Not authenticated");

      setLoading(true);
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, itemId, value, eventId }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "GAS write failed");

        await fetchEvents();
      } finally {
        setLoading(false);
      }
    },
    [itemId, userEmail, fetchEvents]
  );

  const addComment = (text: string) => writeEvent("comment", text);
  const editComment = (id: string, text: string) => writeEvent("edit", text, id);
  const deleteComment = (id: string) => writeEvent("delete", undefined, id);

  const toggleLike = async () => {
    if (!userEmail) throw new Error("Not authenticated");

    setLoading(true);
    try {
      const action = hasLiked ? "unlike" : "like";
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "GAS write failed");
      await fetchEvents();
    } finally {
      setLoading(false);
    }
  };

  return { likes, hasLiked, comments, addComment, editComment, deleteComment, toggleLike, loading };
}