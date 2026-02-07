"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  UserActivityProfile,
  UserLike,
  UserComment,
} from "@/lib/types";

interface ProfileActivityTabsProps {
  activity: UserActivityProfile;
}

export default function ProfileActivityTabs({
  activity,
}: ProfileActivityTabsProps) {
  const [tab, setTab] = useState<"likes" | "comments">("likes");

  const items: (UserLike | UserComment)[] =
    tab === "likes"
      ? activity.likes.items
      : activity.comments.items;

  return (
    <section className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("likes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition
            ${
              tab === "likes"
                ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
                : "border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]/40"
            }`}
        >
          Likes <span className="opacity-70">({activity.likedCount})</span>
        </button>

        <button
          onClick={() => setTab("comments")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition
            ${
              tab === "comments"
                ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
                : "border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]/40"
            }`}
        >
          Comments{" "}
          <span className="opacity-70">({activity.commentCount})</span>
        </button>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.length === 0 && (
          <p className="col-span-full text-sm muted">
            No {tab} yet.
          </p>
        )}

        {items.map((item, idx) => (
          <article
            key={idx}
            className="card p-4 flex gap-4 items-start"
          >
            {/* Item image */}
            <Image
              src={item.itemImage || "/placeholder.png"}
              alt={item.itemName}
              width={56}
              height={56}
              className="rounded-md object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0 space-y-1">
              <a
                href={item.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium leading-tight hover:underline truncate block"
              >
                {item.itemName}
              </a>

              {"likedAt" in item && (
                <p className="text-xs muted">
                  Liked{" "}
                  {new Date(item.likedAt).toLocaleString()}
                </p>
              )}

              {"commentedAt" in item && (
                <>
                  <p className="text-xs muted">
                    Commented{" "}
                    {new Date(item.commentedAt).toLocaleString()}
                  </p>
                  <p className="text-sm leading-snug">
                    {(item as UserComment).comment}
                  </p>
                </>
              )}
            </div>

            {/* User avatar (comments only) */}
            {"userImage" in item && (
              <Image
                src={item.userImage || "/avatar.png"}
                alt="User"
                width={32}
                height={32}
                className="rounded-full border border-[rgb(var(--border))]"
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}