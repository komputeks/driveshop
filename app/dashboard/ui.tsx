"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { getUser, updateUser } from "@/lib/user";
import Activity from "./Activity";

export default function DashboardClient({
  email,
  name,
  image,
}: any) {

  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  /* Load profile */
  useEffect(() => {
    getUser(email).then(setProfile);
  }, [email]);

  async function save() {
    setSaving(true);

    await updateUser({
      email,
      name: profile.name,
      phone: profile.phone,
    });

    setSaving(false);
    alert("Saved");
  }

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto pt-20 p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">

        <img
          src={image}
          className="w-20 h-20 rounded-full border"
        />

        <div>
          <h1 className="text-xl font-bold">
            {profile.name || "User"}
          </h1>

          <p className="text-sm text-gray-500">
            {email}
          </p>
        </div>
      </div>

      {/* Profile Edit */}
      <div className="bg-white border rounded-lg p-6 space-y-4">

        <h2 className="font-semibold text-lg">
          Edit Profile
        </h2>

        <div>
          <label>Name</label>
          <input
            className="input"
            value={profile.name || ""}
            onChange={e =>
              setProfile({
                ...profile,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            className="input"
            value={profile.phone || ""}
            onChange={e =>
              setProfile({
                ...profile,
                phone: e.target.value,
              })
            }
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Activity */}
      <Activity email={email} />

      {/* Logout */}
      <button
        onClick={() => signOut()}
        className="text-red-500 text-sm"
      >
        Logout
      </button>

    </div>
  );
}