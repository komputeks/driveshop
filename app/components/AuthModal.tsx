"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function AuthModal() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (session) return null; // hide modal if logged in

  return (
    <>
      <button onClick={() => setOpen(true)}>Login</button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Sign In</h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
            <button
              className="mt-4 text-gray-500 dark:text-gray-400 w-full"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}