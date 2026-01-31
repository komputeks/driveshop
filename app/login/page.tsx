"use client";

import Providers from "../providers";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <Providers>
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-glass backdrop-blur-xl p-8 rounded-2xl shadow-xl text-center w-[320px]">
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
    </Providers>

  );
}