"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";


function SearchIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}


export default function Header() {
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function close(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () =>
      document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="
      sticky top-0 z-50
      backdrop-blur-xl
      bg-white/80 dark:bg-gray-900/80
      border-b
      border-gray-200/50 dark:border-gray-700/50
    ">

      <div className="
        max-w-7xl mx-auto
        h-16
        px-4 sm:px-6
        flex items-center justify-between
      ">

        {/* ========== LEFT ========== */}
        <Link
          href="/"
          className="
            text-xl font-bold tracking-tight
            bg-gradient-to-r
            from-blue-600 to-purple-600
            bg-clip-text text-transparent
          "
        >
          DriveShop
        </Link>


        {/* ========== CENTER SEARCH ========== */}
        <div className="
          hidden md:flex
          flex-1
          max-w-md
          mx-10
        ">

          <div className="relative w-full">

            <SearchIcon className="
  w-4 h-4
  absolute left-3 top-1/2 -translate-y-1/2
  text-gray-400
"/>

            <input
              placeholder="Search assets, categories..."
              className="
                w-full
                pl-9 pr-3 py-2
                text-sm
                rounded-xl
                border
                bg-gray-50 dark:bg-gray-800
                border-gray-200 dark:border-gray-700
                focus:outline-none
                focus:ring-2 focus:ring-blue-500/30
                transition
              "
            />
          </div>
        </div>


        {/* ========== RIGHT ========== */}
        <div className="flex items-center gap-3">

          {/* Guest */}
          {!session && (
            <Link
              href="/login"
              className="
                px-4 py-2
                text-sm font-medium
                rounded-lg
                bg-blue-600 text-white
                hover:bg-blue-700
                transition
              "
            >
              Sign in
            </Link>
          )}


          {/* Logged in */}
          {session && (
            <div
              ref={menuRef}
              className="relative"
            >

              {/* Profile Button */}
              <button
                onClick={() => setOpen(!open)}
                className="
                  flex items-center gap-2
                  px-2 py-1.5
                  rounded-full
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition
                "
              >

                <img
                  src={session.user?.image || "/avatar.png"}
                  className="
                    w-8 h-8
                    rounded-full
                    border
                  "
                />

                <span className="
                  hidden sm:block
                  text-sm font-medium
                ">
                  {session.user?.name?.split(" ")[0]}
                </span>

                <ChevronIcon
  className={`
    w-4 h-4
    transition
    ${open ? "rotate-180" : ""}
  `}
/>
              </button>


              {/* Dropdown */}
              {open && (
                <div className="
                  absolute right-0 mt-3
                  w-52
                  rounded-xl
                  shadow-xl
                  border
                  bg-white dark:bg-gray-900
                  border-gray-200 dark:border-gray-700
                  overflow-hidden
                  animate-in fade-in slide-in-from-top-2
                ">

                  <div className="
                    px-4 py-3
                    border-b
                    text-sm
                  ">
                    <p className="font-medium">
                      {session.user?.name}
                    </p>

                    <p className="text-gray-500 text-xs truncate">
                      {session.user?.email}
                    </p>
                  </div>


                  <nav className="text-sm">

                    <Link
                      href="/dashboard"
                      className="dropdown-item"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="dropdown-item"
                    >
                      Edit Profile
                    </Link>

                    <Link
                      href="/activity"
                      className="dropdown-item"
                    >
                      Activity
                    </Link>

                    <button
                      onClick={() => signOut()}
                      className="
                        w-full text-left
                        dropdown-item
                        text-red-600
                      "
                    >
                      Logout
                    </button>

                  </nav>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </header>
  );
}