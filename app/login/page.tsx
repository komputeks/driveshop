"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserSync } from "@/lib/useUserSync";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🔁 Sync user to GAS → Sheets
  useUserSync();

  // Redirect after login
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      router.replace(`/profile/${encodeURIComponent(session.user.email)}`);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Checking session…</p>
      </main>
    );
  }

  if (status === "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-400">
            Logged in as {session.user?.email}
          </p>

          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded bg-red-500 text-white text-sm"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-xl text-center w-[320px]">
        <h1 className="text-2xl font-bold mb-6">
          Sign in to DriveShop
        </h1>

        <button
          onClick={() => signIn("google")}
          className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}