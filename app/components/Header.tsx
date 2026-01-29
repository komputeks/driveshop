"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full h-14 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-6">
      
      {/* Left: Logo */}
      <Link
        href="/"
        className="font-bold text-lg text-gray-900 dark:text-white"
      >
        DriveShop
      </Link>

      {/* Right: User */}
      <div className="flex items-center gap-4">

        {status === "loading" && (
          <span className="text-sm text-gray-500">Loading...</span>
        )}

        {status === "unauthenticated" && (
          <Link
            href="/login"
            className="text-blue-600 hover:underline text-sm"
          >
            Login
          </Link>
        )}

        {status === "authenticated" && session?.user && (
          <>
            {/* Profile Link */}
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:underline"
            >
              {session.user.name || "Profile"}
            </Link>

            {/* Avatar */}
            {session.user.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
              />
            )}

            {/* Logout */}
            <button
              onClick={() => signOut()}
              className="text-xs text-red-500 hover:underline"
            >
              Logout
            </button>
          </>
        )}

      </div>
    </header>
  );
}