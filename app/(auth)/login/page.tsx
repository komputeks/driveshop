"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated";

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="container flex justify-center">
        <div className="relative w-full max-w-md">

          {/* Ambient gradient glow */}
          <div
            aria-hidden
            className="absolute -inset-1 rounded-[32px] blur-2xl opacity-60"
            style={{ background: "var(--grad-primary)" }}
          />

          {/* Card */}
          <div className="relative card glass p-8 text-center space-y-6">

            <h1 className="h2">
              Welcome to DriveShop
            </h1>

            <p className="text-sm muted">
              Browse freely. Sign in to interact.
            </p>

            {!isLoggedIn && (
              <button
                onClick={() =>
                  signIn("google", { callbackUrl: "/profile" })
                }
                className="btn btn-lg btn-ghost w-full"
              >
                Continue with Google
              </button>
            )}

            {isLoggedIn && (
              <button
                onClick={() => router.push("/profile")}
                className="btn btn-lg btn-primary w-full"
              >
                Go to your profile →
              </button>
            )}

            {status === "loading" && (
              <p className="text-xs muted">
                Checking session…
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}