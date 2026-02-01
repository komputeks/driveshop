"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { callGAS } from "@/lib/api";

/* ---------------- Types ---------------- */

type UserData = {
  email: string;
  name: string;
  phone: string;
  photo: string;
};

type Activity = {
  id: string;
  itemId: string;
  type: string;
  value: string;
  pageUrl: string;
  createdAt: string;
};

/* ---------------- Page ---------------- */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [saving, setSaving] = useState(false);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  /* ---------------- Load Data ---------------- */

  useEffect(() => {
    if (status !== "authenticated") return;

    if (!session?.user?.email) return;

    const email = session.user.email;

    async function load() {
      try {
        setLoading(true);

        /* User */
        const resUser = await callGAS("user/get", { email });

        if (resUser?.ok) {
          setUser(resUser.user);

          setForm({
            name: resUser.user.name || "",
            phone: resUser.user.phone || "",
          });
        }

        /* Activity */
        const resAct = await callGAS("user/activity", { email });

        if (resAct?.ok) {
          setActivities(resAct.items || []);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session, status]);

  /* ---------------- Save Profile ---------------- */

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);

      const res = await callGAS("user/update", {
        email: user.email,
        name: form.name,
        phone: form.phone,
      });

      if (res?.ok) {
        setUser({
          ...user,
          name: form.name,
          phone: form.phone,
        });

        alert("Profile updated");
      } else {
        alert("Update failed");
      }
    } catch (e) {
      console.error(e);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- States ---------------- */

  if (status === "loading" || loading) {
    return <LoadingScreen />;
  }

  if (!session || !user) {
    return null;
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">

      <div className="max-w-6xl mx-auto p-6 space-y-10">

        {/* Header */}
        <Header user={user} />

        {/* Profile */}
        <section className="glass p-6 rounded-2xl shadow-xl">

          <h2 className="text-xl font-semibold mb-4">
            Profile Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <Field
              label="Full Name"
              value={form.name}
              onChange={(v) =>
                setForm((s) => ({ ...s, name: v }))
              }
            />

            <Field
              label="Phone Number"
              value={form.phone}
              onChange={(v) =>
                setForm((s) => ({ ...s, phone: v }))
              }
            />
          </div>

          <div className="mt-6">
            <button
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </section>

        {/* Activity */}
        <section className="glass p-6 rounded-2xl shadow-xl">

          <h2 className="text-xl font-semibold mb-4">
            Activity Log
          </h2>

          {activities.length === 0 ? (
            <EmptyActivity />
          ) : (
            <ActivityTable data={activities} />
          )}

        </section>

      </div>

    </main>
  );
}

/* ---------------- Components ---------------- */

function Header({ user }: { user: UserData }) {
  return (
    <div className="glass p-6 rounded-2xl flex items-center gap-5">

      {user.photo && (
        <img
          src={user.photo}
          className="w-20 h-20 rounded-full border border-white/20"
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">
          {user.name || "User"}
        </h1>

        <p className="opacity-70">
          {user.email}
        </p>
      </div>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm opacity-70 mb-1">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}

function ActivityTable({ data }: { data: Activity[] }) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead className="text-left opacity-70">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Item</th>
            <th className="p-2">Page</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>

        <tbody>

          {data.map((a) => (
            <tr
              key={a.id}
              className="border-t border-white/5"
            >
              <td className="p-2">{a.type}</td>
              <td className="p-2">{a.itemId}</td>
              <td className="p-2">{a.pageUrl}</td>
              <td className="p-2">
                {new Date(a.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

function EmptyActivity() {
  return (
    <div className="text-center py-12 opacity-60">
      No activity yet.
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      Loading dashboard...
    </div>
  );
}