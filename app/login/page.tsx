"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Sign in with Google</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        onClick={() => signIn("google")}
      >
        Sign in with Google
      </button>
    </div>
  );
}