"use client";

import { useState } from "react";

const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?size=128&font-size=0.5&bold=true&rounded=true&name={session.user?.name}&background=random";
  
  
export default function ProfileClient({ session }: any) {

  const user = session.user;

  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function saveProfile() {

    setSaving(true);
    setMsg("");

    try {

      const res = await fetch(GAS + "?path=user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          phone,
          name: user.name,
        })
      });

      const j = await res.json();

      if (j.ok) {
        setMsg("Saved ✅");
      } else {
        setMsg("Failed ❌");
      }

    } catch {
      setMsg("Network error");
    }

    setSaving(false);
  }

  return (
    <div className="pt-20 max-w-md mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">
        Profile
      </h1>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <img
          src={user.image || DEFAULT_AVATAR}
          className="w-28 h-28 rounded-full border shadow"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Info */}
      <div className="space-y-4 text-sm">

        <p>
          <strong>Name:</strong> {user.name}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        {/* Phone Editor */}
        <div>
          <label className="block mb-1 font-medium">
            Phone
          </label>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter phone"
          />
        </div>

        <p>
          <strong>Role:</strong> {user.role || "user"}
        </p>

        {/* Save */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded mt-4 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {msg && (
          <p className="text-center text-sm mt-2">
            {msg}
          </p>
        )}

      </div>
    </div>
  );
}