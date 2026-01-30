"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "./SearchBar";

export default function Header() {

  const { data: session } = useSession();

  return (
    <header className="fixed top-0 w-full bg-white border-b z-50">

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          DriveShop
        </Link>

        {/* Search */}
        <SearchBar />

        {/* User */}
        <div className="flex items-center gap-4">

          {!session && (
            <Link
              href="/login"
              className="font-medium"
            >
              Login
            </Link>
          )}

          {session && (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium"
              >
                Dashboard
              </Link>

              {session.user?.image && (
                <img
                  src={session.user.image}
                  className="w-9 h-9 rounded-full"
                />
              )}

              <button
                onClick={() => signOut()}
                className="text-sm text-red-600"
              >
                Logout
              </button>
            </>
          )}

        </div>

      </div>
    </header>
  );
}