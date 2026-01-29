"use client";

import { useEffect, useState } from "react";

const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

export default function DashboardClient({ session }: any) {

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    load();

  }, []);

  async function load() {

    try {

      const res = await fetch(GAS + "?path=user/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: session.user.email
        })
      });

      const j = await res.json();

      setItems(j.items || []);

    } catch {
      console.error("Activity fetch failed");
    }

    setLoading(false);
  }

  return (
    <div className="pt-20 max-w-3xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      {/* User Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-6">

        <p className="font-semibold">
          {session.user.name}
        </p>

        <p className="text-sm text-gray-500">
          {session.user.email}
        </p>

        <p className="mt-1">
          Role: {session.user.role || "user"}
        </p>
      </div>

      {/* Activity */}
      <h2 className="text-xl font-semibold mb-3">
        Recent Activity
      </h2>

      {loading && <p>Loading...</p>}

      {!loading && !items.length && (
        <p className="text-gray-500">
          No activity yet
        </p>
      )}

      <div className="space-y-3">

        {items.map((a) => (
          <div
            key={a.id}
            className="border rounded p-3 text-sm"
          >

            <p>
              <strong>{a.type}</strong> on item{" "}
              <span className="font-mono">
                {a.itemId.slice(0, 6)}...
              </span>
            </p>

            {a.value && (
              <p className="text-gray-600">
                “{a.value}”
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {new Date(a.at).toLocaleString()}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}