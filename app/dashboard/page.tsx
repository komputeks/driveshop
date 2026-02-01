"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

type Activity = {
  id: string;
  action: string;
  createdAt: string;
};

type Profile = {
  name: string;
  phone: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------
     AUTH GUARD
  ---------------------------------------------- */

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-10">Loading...</div>;
  }

  if (!session || !session.user || !session.user.email) {
    return null;
  }

  /* ---------------------------------------------
     SAFE USER OBJECT (IMPORTANT)
  ---------------------------------------------- */

  const user = session.user;

  const email = user.email;
  const name = user.name ?? "";
  const image = user.image ?? "";

  /* ---------------------------------------------
     LOAD USER DATA
  ---------------------------------------------- */

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) return;

        const data = await res.json();

        setActivities(data.activities || []);

        setProfile({
          name: data.profile?.name || name,
          phone: data.profile?.phone || "",
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [email, name]);

  /* ---------------------------------------------
     SAVE PROFILE
  ---------------------------------------------- */

  async function saveProfile() {
    setSaving(true);

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: profile.name,
          phone: profile.phone,
        }),
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------
     UI
  ---------------------------------------------- */

  if (loading) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= PROFILE CARD ================= */}

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">

            {/* Avatar */}
            {image && (
              <img
                src={image}
                alt="Profile"
                className="w-16 h-16 rounded-full border"
              />
            )}

            {/* Info */}
            <div>
              <h2 className="text-xl font-semibold">
                {profile.name || name || email}
              </h2>

              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          {/* ================= EDIT FORM ================= */}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium">Full Name</label>

              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number</label>

              <input
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    phone: e.target.value,
                  }))
                }
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-4 bg-black text-white px-5 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* ================= ACTIVITY ================= */}

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Recent Activity
          </h3>

          {activities.length === 0 && (
            <p className="text-gray-500">No activity yet.</p>
          )}

          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span>{a.action}</span>

                <span className="text-gray-400">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}