"use client";

import { useState } from "react";

type Tab = "likes" | "comments";

export default function ProfileActivityTabs() {
  const [tab, setTab] = useState<Tab>("likes");

  return (
    <section className="border-t border-white/10 pt-6 space-y-4">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        <button
          onClick={() => setTab("likes")}
          className={`pb-2 text-sm font-medium ${
            tab === "likes"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Likes
        </button>

        <button
          onClick={() => setTab("comments")}
          className={`pb-2 text-sm font-medium ${
            tab === "comments"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      {tab === "likes" && (
        <div className="text-sm text-gray-400">
          You haven’t liked any items yet.
        </div>
      )}

      {tab === "comments" && (
        <div className="text-sm text-gray-400">
          You haven’t commented on any items yet.
        </div>
      )}
    </section>
  );
}