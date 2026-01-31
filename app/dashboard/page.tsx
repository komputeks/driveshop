"use client";

export const dynamic = "force-dynamic";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (!session) {
    router.push("/login");
    return null;
  }

  const user = session.user!;

  return (
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <div className="bg-glass backdrop-blur-xl rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <img src={user.image || ""} className="w-20 h-20 rounded-full" />
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="opacity-70">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm text-red-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
  );
}