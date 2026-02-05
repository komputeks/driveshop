// app/login/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically sync to GAS when user is authenticated
  useEffect(() => {
    if (status !== "authenticated" || synced) return;

    const syncUser = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        const res = await fetch("/api/user-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: session.user.name,
            photo: session.user.image,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data?.error || "Sync failed");
        setSynced(true);
        // redirect to profile after login
        window.location.href = `/profile/${session.user.email}`;
      } catch (err: any) {
        console.error("Login sync failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [session, status, synced]);

  // Google login handler
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl: "/login" }); // callback back here to trigger sync
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_60%)]" />

      <div className="relative w-full max-w-sm px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
          {/* Logo / Brand */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg">
              DS
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to DriveShop
            </h1>
            <p className="text-sm text-white/60 text-center">
              Access your saved items, uploads, and dashboard
            </p>
          </div>

          {/* Auth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-white py-3 font-semibold text-black transition
                   hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Signing in…
                </>
              ) : (
                "Continue with Google"
              )}
            </span>

            {/* hover sheen */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          {/* Error Message */}
          {error && (
            <p className="mt-4 text-red-400 text-center text-sm">{error}</p>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 text-xs text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            Secure OAuth login
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/40 leading-relaxed">
            By continuing, you agree to our{" "}
            <span className="underline underline-offset-4 cursor-pointer hover:text-white">
              Terms
            </span>{" "}
            and{" "}
            <span className="underline underline-offset-4 cursor-pointer hover:text-white">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </main>
  );
}