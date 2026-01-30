"use client";

import { useEffect, useState } from "react";
import { getUserActivity } from "@/lib/activity";

export default function Activity({ email }: any) {

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"likes" | "comments">("likes");

  useEffect(() => {
    getUserActivity(email).then(setData);
  }, [email]);

  if (!data) return <p>Loading activity...</p>;

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">

        <button
          onClick={() => setTab("likes")}
          className={
            tab === "likes"
              ? "font-semibold border-b-2 border-black"
              : "text-gray-400"
          }
        >
          Favorites ({data.likes.length})
        </button>

        <button
          onClick={() => setTab("comments")}
          className={
            tab === "comments"
              ? "font-semibold border-b-2 border-black"
              : "text-gray-400"
          }
        >
          Comments ({data.comments.length})
        </button>

      </div>

      {/* Likes */}
      {tab === "likes" && (
        <div className="space-y-2 text-sm">

          {data.likes.map((l: any) => (

            <a
              key={l.id}
              href={l.url}
              className="block hover:underline"
            >
              ❤️ {l.name}
            </a>

          ))}

          {!data.likes.length && (
            <p className="text-gray-400">
              No liked items yet.
            </p>
          )}

        </div>
      )}

      {/* Comments */}
      {tab === "comments" && (
        <div className="space-y-3 text-sm">

          {data.comments.map((c: any, i: number) => (

            <div key={i} className="border-b pb-2">

              <a
                href={c.item.url}
                className="font-medium hover:underline"
              >
                {c.item.name}
              </a>

              <p className="text-gray-600">
                “{c.text}”
              </p>

              <p className="text-xs text-gray-400">
                {new Date(c.at).toLocaleDateString()}
              </p>

            </div>

          ))}

          {!data.comments.length && (
            <p className="text-gray-400">
              No comments yet.
            </p>
          )}

        </div>
      )}

    </div>
  );
}