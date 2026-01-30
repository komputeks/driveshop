"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { getDashboard } from "@/lib/dashboard";

export default function DashboardClient({
  email,
  name,
  image,
}: any) {

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [email]);

  async function load() {
    const d = await getDashboard(email);
    setData(d);
  }

  async function save() {

    setSaving(true);

    await fetch("/api/user/update", {
      method: "POST",
      body: JSON.stringify({
        email,
        name: data.user.name,
        phone: data.user.phone,
      }),
    });

    setSaving(false);
    alert("Saved");
    load();
  }

  if (!data) return <p>Loading...</p>;

  const { user, likes, comments } = data;

  return (
    <div className="max-w-4xl mx-auto pt-20 p-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">

        <img
          src={image}
          className="w-20 h-20 rounded-full border"
        />

        <div>
          <h1 className="text-xl font-bold">
            {user.name || "User"}
          </h1>

          <p className="text-sm text-gray-500">
            {email}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">

        {["profile", "likes", "comments"].map(t => (

          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 capitalize ${
              tab === t
                ? "border-b-2 border-black font-semibold"
                : "text-gray-400"
            }`}
          >
            {t}
          </button>

        ))}

      </div>

      {/* Profile */}
      {tab === "profile" && (

        <div className="space-y-4">

          <div>
            <label>Name</label>
            <input
              className="input"
              value={user.name || ""}
              onChange={e =>
                setData({
                  ...data,
                  user: {
                    ...user,
                    name: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              className="input"
              value={user.phone || ""}
              onChange={e =>
                setData({
                  ...data,
                  user: {
                    ...user,
                    phone: e.target.value,
                  },
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

      )}

      {/* Likes */}
      {tab === "likes" && (

        <div className="space-y-2">

          {likes.length === 0 && (
            <p className="text-gray-400">
              No liked items yet
            </p>
          )}

          {likes.map((i: any) => (

            <a
              key={i.id}
              href={i.url}
              className="block border p-3 rounded hover:bg-gray-50"
            >
              {i.title}
            </a>

          ))}

        </div>

      )}

      {/* Comments */}
      {tab === "comments" && (

        <div className="space-y-3 text-sm">

          {comments.length === 0 && (
            <p className="text-gray-400">
              No comments yet
            </p>
          )}

          {comments.map((c: any, i: number) => (

            <div
              key={i}
              className="border p-3 rounded"
            >
              <a
                href={c.item.url}
                className="font-medium"
              >
                {c.item.title}
              </a>

              <p className="mt-1 text-gray-600">
                {c.text}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {new Date(c.at).toLocaleString()}
              </p>
            </div>

          ))}

        </div>

      )}

      {/* Logout */}
      <div className="mt-10">

        <button
          onClick={() => signOut()}
          className="text-red-500 text-sm"
        >
          Logout
        </button>

      </div>

    </div>
  );
}