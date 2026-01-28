"use client";

import { signIn } from "next-auth/react";

export default function LoginClient() {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl w-96 text-center">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Welcome Back
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Sign in to continue
      </p>

      <button
        onClick={() => signIn("google")}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
      >
        Sign in with Google
      </button>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        By signing in, you agree to our terms.
      </p>
    </div>
  );
}