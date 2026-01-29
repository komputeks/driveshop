"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {

  const { data: session, status } = useSession();

  const [open, setOpen] = useState(false);

  return (
    <header className="w-full h-14 border-b bg-white dark:bg-gray-900 flex items-center px-4 md:px-6">

      {/* ================================= */}
      {/* LEFT — LOGO */}
      {/* ================================= */}
      <Link
        href="/"
        className="font-bold text-lg text-gray-900 dark:text-white"
      >
        DriveShop
      </Link>

      {/* ================================= */}
      {/* CENTER — SEARCH + CATEGORIES */}
      {/* ================================= */}
      <div className="flex items-center gap-4 ml-6 flex-1">

        {/* Search */}
        <input
          type="text"
          placeholder="Search assets..."
          className="hidden md:block px-3 py-1.5 text-sm rounded border bg-transparent focus:outline-none focus:ring w-64"
        />

        {/* Categories (Dynamic Ready) */}
        <nav className="hidden md:flex gap-3 text-sm">

          <Link href="/category/all" className="hover:underline">
            All
          </Link>

          <Link href="/category/images" className="hover:underline">
            Images
          </Link>

          <Link href="/category/videos" className="hover:underline">
            Videos
          </Link>

          <Link href="/category/docs" className="hover:underline">
            Docs
          </Link>

        </nav>
      </div>

      {/* ================================= */}
      {/* RIGHT — USER AREA */}
      {/* ================================= */}
      <div className="relative flex items-center gap-3">

        {/* Loading */}
        {status === "loading" && (
          <span className="text-sm text-gray-500">
            Loading...
          </span>
        )}

        {/* Guest */}
        {status === "unauthenticated" && (
          <Link
            href="/login"
            className="text-blue-600 hover:underline text-sm"
          >
            Login
          </Link>
        )}

        {/* Authenticated */}
        {status === "authenticated" && session?.user && (

          <div className="relative">

            {/* Profile Button */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 focus:outline-none"
            >

              {/* Avatar */}
              <img
                src={
                  session.user.image ||
                  "https://ui-avatars.com/api/?size=64&rounded=true&name=" +
                    session.user.name
                }
                alt="avatar"
                className="w-8 h-8 rounded-full border"
                referrerPolicy="no-referrer"
              />

              {/* Name */}
              <span className="hidden md:block text-sm font-medium">
                {session.user.name}
              </span>

              {/* Arrow */}
              <span className="text-xs">▼</span>

            </button>

            {/* ================================ */}
            {/* DROPDOWN MENU */}
            {/* ================================ */}
            {open && (

              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg overflow-hidden z-50"
                onMouseLeave={() => setOpen(false)}
              >

                {session.user.role === "admin" && (

                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Admin Panel
                    </Link>
                  
                  )}
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Dashboard
                </Link>

                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Profile
                </Link>

                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit Profile
                </Link>

                <hr className="border-gray-200 dark:border-gray-700" />

                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Logout
                </button>

              </div>
            )}

          </div>
        )}

      </div>

    </header>
  );
}