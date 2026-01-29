"use client";

import { useEvent } from "@/lib/useEvent";
import { useEffect, useState, useRef } from "react";

export default function ItemCard({ item }: any) {
  const { send } = useEvent();

  const viewedRef = useRef(false);

  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  /* ---------------- AUTO VIEW ---------------- */

  useEffect(() => {
    if (viewedRef.current) return;

    const el = document.getElementById(`item-${item.id}`);
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewedRef.current = true;
          send(item.id, "view");
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [item.id]);

  /* ---------------- LIKE LOCK ---------------- */

  useEffect(() => {
    const key = `liked-${item.id}`;

    if (localStorage.getItem(key)) {
      setLiked(true);
    }
  }, [item.id]);

  function handleLike() {
    const key = `liked-${item.id}`;

    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, "1");

    setLiked(true);
    send(item.id, "like");
  }

  /* ---------------- COMMENT ---------------- */

  function handleComment() {
    if (!text.trim()) return;

    send(item.id, "comment", text);

    setText("");
    setOpen(false);
  }

  /* ---------------- UI ---------------- */

  return (
    <div
      id={`item-${item.id}`}
      className="rounded-xl overflow-hidden shadow bg-white dark:bg-gray-900"
    >
      <img
        src={item.cdnUrl}
        alt={item.name}
        loading="lazy"
        className="w-full h-48 object-cover"
      />

      <div className="p-4">

        <h3 className="font-semibold truncate">
          {item.name}
        </h3>

        <div className="flex justify-between mt-3">

          {/* LIKE */}
          <button
            disabled={liked}
            onClick={handleLike}
            className={liked ? "opacity-50 cursor-not-allowed" : ""}
          >
            ❤️ {item.likes}
          </button>

          {/* COMMENT */}
          <button onClick={() => setOpen(true)}>
            💬
          </button>

          {/* VIEW (manual fallback) */}
          <button onClick={() => send(item.id, "view")}>
            👁 {item.views}
          </button>

        </div>
      </div>

      {/* COMMENT MODAL */}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl w-80">

            <h3 className="font-semibold mb-2">
              Add Comment
            </h3>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              rows={3}
            />

            <div className="flex justify-end gap-2 mt-3">

              <button
                className="text-gray-500"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={handleComment}
              >
                Send
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}