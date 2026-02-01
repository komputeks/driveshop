"use client";

import { useState } from "react";

type Props = {
  sessionUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  userData: any;
};

export default function DashboardClient({
  sessionUser,
  userData,
}: Props) {
  const [name, setName] = useState(userData?.name || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);

    await fetch("/api/user", {
      method: "POST",
      body: JSON.stringify({
        name,
        phone,
      }),
    });

    setSaving(false);
    alert("Saved");
  };

  return (
    <div className="min-h-screen bg-blue-600 text-white p-8">

      <div className="max-w-3xl mx-auto bg-white text-black rounded-xl p-6 shadow">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">

          {sessionUser.image && (
            <img
              src={sessionUser.image}
              className="w-16 h-16 rounded-full"
            />
          )}

          <div>
            <h1 className="text-2xl font-bold">
              {sessionUser.name}
            </h1>

            <p className="text-gray-600">
              {sessionUser.email}
            </p>
          </div>

        </div>

        {/* Profile */}
        <div className="space-y-4">

          <div>
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {saving ? "Saving..." : "Save"}
          </button>

        </div>

      </div>

    </div>
  );
}