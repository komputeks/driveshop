// app/dashboard/page.tsx
"use client";

export const dynamic = "force-dynamic"; // Never prerender this page

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Providers from "@/app/providers";

export default function Dashboard() {
  const { data: session, status } = useSession() || {}; // Safe destructure
  const router = useRouter();

  // Loading state while session is being fetched
  if (!status || status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Loading your dashboard...</p>
      </main>
    );
  }

  // Redirect if user is not logged in
  if (!session) {
    if (typeof window !== "undefined") {
      router.replace("/login"); // client-side redirect
    }
    return null;
  }

  const user = session.user!;

  return (
    <Providers>
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <div className="bg-glass backdrop-blur-xl rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.image || ""}
              alt="User avatar"
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="opacity-70">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
    </Providers>
  );
}