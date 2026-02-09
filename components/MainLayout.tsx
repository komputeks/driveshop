"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import CategoryDropdown from "./CategoryDropdown";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const user = session?.user;
  
  window.onerror = function (msg, url, line, col, error) {
  alert(`Error: ${msg}\nLine: ${line}`);
};

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-950 shadow-md">
        <div className="container-app flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-500"
          >
            Simon Wokabi Codes
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <CategoryDropdown />
          </nav>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <Link href="/profile" className="flex items-center gap-2 text-sm">
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
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}