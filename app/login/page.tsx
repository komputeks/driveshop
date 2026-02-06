"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 text-center">

        {/* Glow */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl pointer-events-none" />

        <div className="relative space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to DriveShop
          </h1>

          <p className="text-sm text-zinc-400">
            Browse freely. Sign in to interact.
          </p>

          {!isLoggedIn && (
            <button
              onClick={() =>
                signIn("google", { callbackUrl: "/profile" })
              }
              className="w-full py-3 rounded-xl font-semibold text-black
                         bg-white hover:bg-zinc-200
                         transition-all duration-200
                         hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue with Google
            </button>
          )}

          {isLoggedIn && (
            <button
              onClick={() => router.push("/profile")}
              className="w-full py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-indigo-500 to-purple-600
                         hover:from-indigo-400 hover:to-purple-500
                         transition-all duration-200
                         hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to your profile →
            </button>
          )}

          {status === "loading" && (
            <div className="text-xs text-zinc-500">
              Checking session…
            </div>
          )}
        </div>
      </div>
    </main>
  );
}