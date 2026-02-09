"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import CategoryDropdown from "./CategoryDropdown";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 shadow-md">
        <div className="container-app flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href="/"
            className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-500"
          >
            Simon Wokabi Codes
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <CategoryDropdown />
          </nav>

          {/* Auth + Mobile toggle */}
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium hover:text-blue-600"
              >
                <img
                  src={user.image || "/default-avatar.png"}
                  alt={user.name || "Profile"}
                  className="w-8 h-8 rounded-full"
                />
                {user.name || user.email}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Login
              </Link>
            )}

            <button
              className="md:hidden btn btn-ghost btn-sm"
              onClick={() => setMobileMenuOpen(p => !p)}
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <CategoryDropdown />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-50 dark:bg-slate-900 text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Simon Wokabi Codes
      </footer>
    </div>
  );
}