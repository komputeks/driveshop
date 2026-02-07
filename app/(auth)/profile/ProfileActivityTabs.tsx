"use client";

import { useState } from "react";
import { UserActivity } from "@/lib/userActivityTypes";
import Image from "next/image";

interface ProfileActivityTabsProps {
  activity: UserActivity | null;
}

export default function ProfileActivityTabs({ activity }: ProfileActivityTabsProps) {
  const [tab, setTab] = useState<"likes" | "comments">("likes");

  if (!activity) {
    return (
      <section className="border-t border-white/10 pt-6">
        <p className="text-gray-400">No activity yet.</p>
      </section>
    );
  }

  const likes = activity.likes.items;
  const comments = activity.comments.items;

  return (
    <section className="border-t border-white/10 pt-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-4">
        <button
          className={`px-3 py-1 font-semibold ${
            tab === "likes" ? "border-b-2 border-blue-400 text-white" : "text-gray-400"
          }`}
          onClick={() => setTab("likes")}
        >
          Likes ({activity.likedCount})
        </button>

        <button
          className={`px-3 py-1 font-semibold ${
            tab === "comments" ? "border-b-2 border-blue-400 text-white" : "text-gray-400"
          }`}
          onClick={() => setTab("comments")}
        >
          Comments ({activity.commentCount})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab === "likes" &&
          (likes.length ? (
            likes.map((item) => (
              <div key={item.itemId} className="flex items-center gap-4">
                <Image
                  src={item.itemImage || "/avatar.png"}
                  alt={item.itemName}
                  width={48}
                  height={48}
                  className="rounded-md"
                />
                <div>
                  <p className="font-semibold">{item.itemName}</p>
                  {item.pageUrl && (
                    <a
                      href={item.pageUrl}
                      className="text-blue-400 text-sm hover:underline"
                    >
                      View item
                    </a>
                  )}
                  <p className="text-gray-400 text-sm">
                    Liked at {new Date(item.likedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No likes yet.</p>
          ))}

        {tab === "comments" &&
          (comments.length ? (
            comments.map((c) => (
              <div key={c.itemId + c.commentedAt} className="flex items-start gap-4">
                <Image
                  src={c.itemImage || "/avatar.png"}
                  alt={c.itemName}
                  width={48}
                  height={48}
                  className="rounded-md"
                />
                <div>
                  <p className="font-semibold">{c.itemName}</p>
                  {c.pageUrl && (
                    <a
                      href={c.pageUrl}
                      className="text-blue-400 text-sm hover:underline"
                    >
                      View item
                    </a>
                  )}
                  <p className="text-gray-400 text-sm">Commented at {new Date(c.commentedAt).toLocaleString()}</p>
                  <p className="mt-1">{c.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No comments yet.</p>
          ))}
      </div>
    </section>
  );
}