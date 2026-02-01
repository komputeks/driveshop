// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { callGAS } from "@/lib/api";

interface User {
  email: string;
  name: string;
  phone?: string;
  photo?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface Activity {
  id: string;
  itemId: string;
  type: string;
  value: string;
  pageUrl: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [editingUser, setEditingUser] = useState({ name: false, phone: false });
  const [editingActivity, setEditingActivity] = useState<{ [key: string]: boolean }>({});
  const [formUser, setFormUser] = useState({ name: "", phone: "" });
  const [formActivity, setFormActivity] = useState<{ [key: string]: { type: string; value: string } }>({});
  const [loading, setLoading] = useState(true);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user & activity once authenticated
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchData = async () => {
      try {
        const resUser = await callGAS("user/get", { email: session.user.email });
        if (resUser.ok) {
          setUser(resUser.user);
          setFormUser({ name: resUser.user.name || "", phone: resUser.user.phone || "" });
        }

        const resAct = await callGAS("user/activity", { email: session.user.email });
        if (resAct.ok) {
          setActivity(resAct.items || []);
          const activityForm: { [key: string]: { type: string; value: string } } = {};
          resAct.items.forEach((a: Activity) => {
            activityForm[a.id] = { type: a.type, value: a.value };
          });
          setFormActivity(activityForm);
        }
      } catch (err) {
        console.error("Failed to fetch user/activity:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Handle user input changes
  const handleUserChange = (field: "name" | "phone", value: string) => {
    setFormUser((prev) => ({ ...prev, [field]: value }));
  };

  const saveUserField = async (field: "name" | "phone") => {
    if (!user) return;
    try {
      await callGAS("user/update", { email: user.email, [field]: formUser[field] });
      setUser((prev) => prev ? { ...prev, [field]: formUser[field] } : prev);
      setEditingUser((prev) => ({ ...prev, [field]: false }));
    } catch (err) {
      console.error("Failed to save user field:", err);
    }
  };

  // Handle activity input changes
  const handleActivityChange = (id: string, field: "type" | "value", value: string) => {
    setFormActivity((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveActivity = async (id: string) => {
    if (!user) return;
    try {
      const { type, value } = formActivity[id];
      await callGAS("event", { itemId: id, type, value, email: user.email });
      setActivity((prev) =>
        prev.map((a) => (a.id === id ? { ...a, type, value } : a))
      );
      setEditingActivity((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error("Failed to save activity:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Unable to load user data.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {user.photo && (
          <img
            src={user.photo}
            alt="Avatar"
            className="w-20 h-20 rounded-full border"
          />
        )}
        <div>
          {/* Name */}
          <div className="flex items-center gap-2">
            {editingUser.name ? (
              <>
                <input
                  className="border p-1 rounded"
                  value={formUser.name}
                  onChange={(e) => handleUserChange("name", e.target.value)}
                />
                <button
                  onClick={() => saveUserField("name")}
                  className="bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingUser((prev) => ({ ...prev, name: false }))}
                  className="px-2 py-1 rounded border"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">{user.name}</h2>
                <button
                  onClick={() => setEditingUser((prev) => ({ ...prev, name: true }))}
                  className="text-sm text-blue-600 underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 mt-1">
            {editingUser.phone ? (
              <>
                <input
                  className="border p-1 rounded"
                  value={formUser.phone}
                  onChange={(e) => handleUserChange("phone", e.target.value)}
                />
                <button
                  onClick={() => saveUserField("phone")}
                  className="bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingUser((prev) => ({ ...prev, phone: false }))}
                  className="px-2 py-1 rounded border"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-600">{user.phone || "No phone set"}</span>
                <button
                  onClick={() => setEditingUser((prev) => ({ ...prev, phone: true }))}
                  className="text-sm text-blue-600 underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Time</th>
              <th className="border px-3 py-2 text-left">Type</th>
              <th className="border px-3 py-2 text-left">Item</th>
              <th className="border px-3 py-2 text-left">Page</th>
              <th className="border px-3 py-2 text-left">Value</th>
              <th className="border px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activity.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No activity yet.
                </td>
              </tr>
            ) : (
              activity.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{new Date(act.createdAt).toLocaleString()}</td>

                  {/* Editable type */}
                  <td className="border px-3 py-2">
                    {editingActivity[act.id] ? (
                      <input
                        className="border p-1 rounded w-full"
                        value={formActivity[act.id]?.type || ""}
                        onChange={(e) => handleActivityChange(act.id, "type", e.target.value)}
                      />
                    ) : (
                      act.type
                    )}
                  </td>

                  <td className="border px-3 py-2">{act.itemId}</td>
                  <td className="border px-3 py-2">{act.pageUrl}</td>

                  {/* Editable value */}
                  <td className="border px-3 py-2">
                    {editingActivity[act.id] ? (
                      <input
                        className="border p-1 rounded w-full"
                        value={formActivity[act.id]?.value || ""}
                        onChange={(e) => handleActivityChange(act.id, "value", e.target.value)}
                      />
                    ) : (
                      act.value
                    )}
                  </td>

                  {/* Actions */}
                  <td className="border px-3 py-2 flex gap-2">
                    {editingActivity[act.id] ? (
                      <>
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded"
                          onClick={() => saveActivity(act.id)}
                        >
                          Save
                        </button>
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => setEditingActivity((prev) => ({ ...prev, [act.id]: false }))}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-blue-600 underline text-sm"
                        onClick={() => setEditingActivity((prev) => ({ ...prev, [act.id]: true }))}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}