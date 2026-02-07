"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="
        btn
        border border-[rgb(var(--border))]
        text-[rgb(var(--muted))]
        hover:border-[rgb(var(--primary))]
        hover:text-[rgb(var(--primary))]
        focus:ring-[rgb(var(--primary))]/40
      "
    >
      Log out
    </button>
  );
}