"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Activity = {
  id: string;
  itemId: string;
  type: string;
  value: string;
  createdAt: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [activity, setActivity] = useState<Activity[]>([]);

  const [saving, setSaving] = useState(false);

  // ✅ Extract email safely
  const email = session?.user?.email || null;

  // Load profile
  useEffect(() => {
    if (!email) return;

    async function load() {
      setLoading(true);

      const res = await fetch("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.ok) {
        const u = data.user.user;

        setName(u?.name || "");
        setPhone(u?.phone || "");

        setActivity(data.activity?.items || []);
      }

      setLoading(false);
    }

    load();
  }, [email]);

  // Save profile
  async function saveProfile() {
    if (!email) return;

    setSaving(true);

    await fetch("/api/user-update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name,
        phone,
      }),
    });

    setSaving(false);
  }

  // Loading screen
  if (status === "loading" || loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Not logged in
  if (!session || !email) return null;

  const user = session.user;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">

      {/* Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">

        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              className="w-16 h-16 rounded-full border"
            />
          )}

          <div>
            <h1 className="text-xl font-bold">
              {email}
            </h1>

            <p className="text-sm opacity-70">
              User Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded"
        >
          Sign Out
        </button>

      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">

        {/* Profile */}
        <div className="md:col-span-1 bg-white/5 rounded-xl p-6 backdrop-blur rounded-2xl">

          <h2 className="font-semibold mb-4">
            Profile
          </h2>

          <label className="block text-sm mb-1">
            Name
          </label>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mb-4 px-3 py-2 rounded bg-black/40 outline-none focus:ring-2 focus:ring-blue-600"
          />

          <label className="block text-sm mb-1">
            Phone
          </label>

          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full mb-4 px-3 py-2 rounded bg-black/40 outline-none focus:ring-2 focus:ring-blue-600"
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

        {/* Activity */}
        <div className="md:col-span-2 bg-white/5 rounded-xl p-6 backdrop-blur rounded-2xl">

          <h2 className="font-semibold mb-4">
            Recent Activity
          </h2>

          {activity.length === 0 && (
            <p className="opacity-60">
              No activity yet.
            </p>
          )}

          <div className="space-y-3 max-h-[500px] overflow-auto pr-2">

            {activity.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-black/30 rounded-lg p-3 hover:bg-black/40 transition"
              >

                <div>
                  <p className="font-medium capitalize">
                    {a.type}
                  </p>

                  <p className="text-sm opacity-60">
                    Item: {a.itemId}
                  </p>
                </div>

                <div className="text-sm opacity-60">
                  {new Date(a.createdAt).toLocaleString()}
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </main>
  );
}