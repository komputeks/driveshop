"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { callGAS } from "@/lib/api";

type User = {
  email: string;
  name: string;
  phone: string;
  photo: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth is ready
    if (status !== "authenticated") return;
    if (!session) return;

    const authUser = session.user;

    if (!authUser?.email) return;

    const email = authUser.email;
    const name = authUser.name ?? "";
    const photo = authUser.image ?? "";

    async function load() {
      try {
        // Ensure user exists
        await callGAS("user/upsert", {
          email,
          name,
          photo,
        });

        // Fetch user
        const res = await callGAS("user/get", { email });

        if (res.ok) {
          setUser(res.user);
        } else {
          console.error("GAS error:", res);
        }

      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();

  }, [status, session]);

  /* ---------------- Loading states ---------------- */

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 shadow mb-8">

        <div className="flex items-center gap-6">

          {user.photo && (
            <img
              src={user.photo}
              className="w-20 h-20 rounded-full border"
              alt="Avatar"
            />
          )}

          <div>
            <p className="text-xl font-semibold">
              {user.name || "Unnamed User"}
            </p>

            <p className="opacity-70">
              {user.email}
            </p>
          </div>

        </div>

      </div>

      {/* Profile Info */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 shadow space-y-4">

        <h2 className="text-lg font-semibold mb-4">
          Profile
        </h2>

        <div>
          <label className="block mb-1 text-sm">
            Name
          </label>

          <input
            className="w-full p-2 rounded bg-black/20 border"
            value={user.name}
            readOnly
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">
            Phone
          </label>

          <input
            className="w-full p-2 rounded bg-black/20 border"
            value={user.phone || ""}
            readOnly
          />
        </div>

      </div>

    </div>
  );
}