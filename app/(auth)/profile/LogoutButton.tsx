"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="
        px-4 py-2 rounded-md text-sm font-medium
        border border-[rgb(var(--border))]
        text-[rgb(var(--muted))]
        transition
        hover:border-[rgb(var(--accent))]
        hover:text-[rgb(var(--accent))]
        active:scale-[0.98]
      "
    >
      Log out
    </button>
  );
}