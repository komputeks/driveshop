"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b flex items-center justify-between px-6">

      {/* Logo */}
      <Link href="/" className="font-bold text-lg">
        DriveShop
      </Link>

      {/* Search */}
      <input
        placeholder="Search..."
        className="border rounded px-2 py-1 text-sm"
      />

      {/* User */}
      <div className="flex items-center gap-3">
        {!session && (
          <Link href="/login" className="text-blue-600">
            Login
          </Link>
        )}

        {session && (
          <>
            <Link href="/profile" className="text-sm">
              {session.user?.name}
            </Link>

            {session.user?.image && (
              <img
                src={session.user.image}
                className="w-8 h-8 rounded-full"
              />
            )}

            <button
              onClick={() => signOut()}
              className="text-xs text-red-500"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}