"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full bg-red-600 text-white py-2 rounded"
    >
      Logout
    </button>
  );
}