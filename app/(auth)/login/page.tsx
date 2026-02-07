"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="container-page flex justify-center">
        <div className="relative w-full max-w-md">

          {/* Ambient gradient glow */}
          <div
            aria-hidden
            className="absolute -inset-2 rounded-xl blur-2xl opacity-60"
            style={{ background: "var(--grad-primary)" }}
          />

          {/* Card */}
          <div className="relative card p-8 text-center space-y-6">

            <h1 className="text-xl font-semibold">
              Welcome to DriveShop
            </h1>

            <p className="text-sm muted">
              Browse freely. Sign in to interact.
            </p>

            {!isLoggedIn && (
              <button
                onClick={() => signIn("google", { callbackUrl: "/profile" })}
                disabled={isLoading}
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

            {isLoading && (
              <p className="text-xs muted" aria-live="polite">
                Checking session…
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}