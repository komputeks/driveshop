"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { callAPI } from "@/lib/api";

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
    if (status !== "authenticated") return;
    if (!session?.user?.email) return;

    const email = session.user.email;

    async function load() {
      try {
        // Ensure user exists
        await callAPI("user/upsert", {
          email,
          name: session.user?.name || "",
          photo: session.user?.image || "",
        });

        // Fetch user
        const res = await callAPI("user/get", { email });

        if (res.ok) {
          setUser(res.user);
        } else {
          console.error(res.error);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();

  }, [status, session]);

  if (status === "loading" || loading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!user) {
    return <div className="p-10 text-red-500">Failed to load user</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="bg-white/5 backdrop-blur rounded-xl p-6 shadow mb-8">

        <div className="flex items-center gap-6">

          {user.photo && (
            <img
              src={user.photo}
              className="w-20 h-20 rounded-full border"
              alt=""
            />
          )}

          <div>
            <p className="text-xl font-semibold">
              {user.name}
            </p>
            <p className="opacity-70">
              {user.email}
            </p>
          </div>

        </div>

      </div>

      <div className="bg-white/5 backdrop-blur rounded-xl p-6 shadow space-y-4">

        <h2 className="text-lg font-semibold mb-4">
          Profile
        </h2>

        <div>
          <label className="block mb-1 text-sm">Name</label>
          <input
            className="w-full p-2 rounded bg-black/20 border"
            value={user.name}
            readOnly
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Phone</label>
          <input
            className="w-full p-2 rounded bg-black/20 border"
            value={user.phone}
            readOnly
          />
        </div>

      </div>

    </div>
  );
}