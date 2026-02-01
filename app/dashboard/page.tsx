"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { callGAS } from "@/lib/api";

/* ---------------- Types ---------------- */

type UserData = {
  email: string;
  name: string;
  phone?: string;
  photo?: string;
};

type Activity = {
  id: string;
  type: string;
  value: string;
  date: string;
};

/* ---------------- Component ---------------- */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserData | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  /* ---------------- Fetch Data ---------------- */

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.email) return;

    const email = session.user.email;

    const load = async () => {
      try {
        /* Fetch user */

        const resUser = await callGAS("user/get", { email });

        if (resUser?.ok && resUser.user) {
          setUser(resUser.user);
          setFormName(resUser.user.name || "");
          setFormPhone(resUser.user.phone || "");
        } else {
          /* Create if missing */

          const createRes = await callGAS("user", {
            email,
            name: session.user?.name || "",
            photo: session.user?.image || "",
          });

          if (createRes?.ok) {
            setUser(createRes.user);
            setFormName(createRes.user.name || "");
          }
        }

        /* Fetch activity */

        const resAct = await callGAS("user/activity", { email });

        if (resAct?.ok && Array.isArray(resAct.items)) {
          setActivity(resAct.items);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status, session]);

  /* ---------------- Update Profile ---------------- */

  const saveProfile = async () => {
    if (!user) return;

    try {
      const res = await callGAS("user/update", {
        email: user.email,
        name: formName,
        phone: formPhone,
      });

      if (res?.ok) {
        setUser(res.user);
        alert("Profile updated ✅");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed ❌");
    }
  };

  /* ---------------- Loading ---------------- */

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  /* ---------------- Error ---------------- */

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Failed to load user data
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}

        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow">

          <div className="flex items-center gap-4">

            {user.photo && (
              <img
                src={user.photo}
                className="w-16 h-16 rounded-full border"
              />
            )}

            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

          </div>

          <button
            onClick={() => signOut()}
            className="text-sm text-red-500 hover:underline"
          >
            Sign out
          </button>

        </div>

        {/* Profile */}

        <div className="bg-white rounded-xl p-6 shadow">

          <h2 className="font-semibold mb-4">Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-600">Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>

          </div>

          <button
            onClick={saveProfile}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>

        </div>

        {/* Activity */}

        <div className="bg-white rounded-xl p-6 shadow">

          <h2 className="font-semibold mb-4">Recent Activity</h2>

          {activity.length === 0 ? (
            <p className="text-sm text-gray-500">
              No activity yet
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Value</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>

                <tbody>

                  {activity.map((a) => (
                    <tr key={a.id} className="border-b">

                      <td className="py-2">{a.type}</td>
                      <td className="py-2">{a.value}</td>
                      <td className="py-2">
                        {new Date(a.date).toLocaleString()}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}