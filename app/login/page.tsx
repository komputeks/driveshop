"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 border rounded-lg shadow w-full max-w-sm text-center">

        <h1 className="text-xl font-bold mb-4">
          DriveShop Login
        </h1>

        <button
          onClick={() => signIn("google")}
          className="w-full bg-black text-white py-2 rounded"
        >
          Sign in with Google
        </button>

      </div>
    </div>
  );
}