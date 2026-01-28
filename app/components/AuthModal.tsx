"use client";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();

  if (!open) return null;

  if (session) return <div>Logged in as {session.user?.email}</div>;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-80">
        <h2 className="text-lg font-bold mb-4">Sign In</h2>
        <button
          className="bg-blue-600 text-white w-full py-2 rounded mb-2"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
        <button className="text-gray-500 text-sm" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}