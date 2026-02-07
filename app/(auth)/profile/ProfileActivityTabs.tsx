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
    <section className="stack">

      {/* Tabs */}
      <div className="inline">
        <TabButton
          active={tab === "likes"}
          onClick={() => setTab("likes")}
        >
          Likes <span className="opacity-60">({activity.likedCount})</span>
        </TabButton>

        <TabButton
          active={tab === "comments"}
          onClick={() => setTab("comments")}
        >
          Comments{" "}
          <span className="opacity-60">({activity.commentCount})</span>
        </TabButton>
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
                className="font-medium text-sm leading-tight truncate block hover:underline"
              >
                {item.itemName}
              </a>

              {"likedAt" in item && (
                <p className="text-xs muted">
                  Liked {new Date(item.likedAt).toLocaleDateString()}
                </p>
              )}

              {"commentedAt" in item && (
                <>
                  <p className="text-xs muted">
                    Commented {new Date(item.commentedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm leading-snug">
                    {(item as UserComment).comment}
                  </p>
                </>
              )}
            </div>

            {"userImage" in item && (
              <Image
                src={item.userImage || "/avatar.png"}
                alt="User"
                width={28}
                height={28}
                className="rounded-full border border-[rgb(var(--border))] flex-shrink-0"
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------
   Local tab primitive
-------------------------------- */

function TabButton({
  active,
  children,
  ...props
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded-md text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40",
        active
          ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
          : "border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]/40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}