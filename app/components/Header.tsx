"use client";

import Link from "next/link";
import AuthModal from "./AuthModal";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-40 flex justify-between items-center px-6 py-3">
      <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
        DriveHit
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/search" className="text-gray-700 dark:text-gray-200">Search</Link>

        {session ? (
          <>
            <Link href="/profile" className="text-gray-700 dark:text-gray-200">{session.user?.name}</Link>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Sign Out
            </button>
          </>
        ) : (
          <AuthModal />
        )}
      </div>
    </header>
  );
}