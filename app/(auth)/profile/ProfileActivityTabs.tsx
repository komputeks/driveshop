"use client";

import { useState } from "react";
import Image from "next/image";
import {
  UserActivityProfile,
  UserLike,
  UserComment,
} from "@/lib/userActivityTypes";

interface ProfileActivityTabsProps {
  activity: UserActivityProfile;
}

export default function ProfileActivityTabs({
  activity,
}: ProfileActivityTabsProps) {
  const [tab, setTab] = useState<"likes" | "comments">("likes");

  const items: (UserLike | UserComment)[] =
    tab === "likes" ? activity.likes.items : activity.comments.items;

  return (
    <section className="border-t border-white/10 pt-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setTab("likes")}
          className={`px-4 py-2 rounded ${
            tab === "likes"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-gray-300"
          }`}
        >
          Likes ({activity.likedCount})
        </button>

        <button
          onClick={() => setTab("comments")}
          className={`px-4 py-2 rounded ${
            tab === "comments"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-gray-300"
          }`}
        >
          Comments ({activity.commentCount})
        </button>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.length === 0 && (
          <p className="text-gray-400 col-span-full">
            No {tab} yet.
          </p>
        )}

        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-3 p-3 border border-white/10 rounded items-start"
          >
            {/* Item image */}
            <Image
              src={item.itemImage || "/placeholder.png"}
              alt={item.itemName}
              width={48}
              height={48}
              className="rounded object-cover"
            />

            <div className="flex-1 min-w-0">
              <a
                href={item.pageUrl}
                className="font-medium hover:underline block truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.itemName}
              </a>

              {tab === "likes" && "likedAt" in item && (
                <p className="text-xs text-gray-400">
                  {new Date(item.likedAt).toLocaleString()}
                </p>
              )}

              {tab === "comments" && "commentedAt" in item && (
                <>
                  <p className="text-xs text-gray-400">
                    {new Date(item.commentedAt).toLocaleString()}
                  </p>
                  <p className="text-sm mt-1">
                    {(item as UserComment).comment}
                  </p>
                </>
              )}
            </div>

            {/* User avatar (comments only) */}
            {tab === "comments" && "userImage" in item && (
              <Image
                src={(item as UserComment).userImage || "/avatar.png"}
                alt="User"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}