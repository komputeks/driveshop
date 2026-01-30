"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { getDashboard } from "@/lib/dashboard";

export default function DashboardClient({
  email,
  image,
}: any) {

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const d = await getDashboard(email);
    setData(d);
  }

  async function saveProfile() {

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
    load();
  }

  if (!data) return <Loading />;

  const { user, likes, comments } = data;

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <Header
          user={user}
          image={image}
          email={email}
        />

        {/* Stats */}
        <Stats
          likes={likes.length}
          comments={comments.length}
        />

        {/* Tabs */}
        <Tabs tab={tab} setTab={setTab} />

        {/* Content */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">

          {tab === "overview" && (
            <Overview
              user={user}
              saving={saving}
              setData={setData}
              save={saveProfile}
            />
          )}

          {tab === "likes" && (
            <Likes items={likes} />
          )}

          {tab === "comments" && (
            <Comments items={comments} />
          )}

          {tab === "settings" && (
            <Settings />
          )}

        </div>

      </div>

    </div>
  );
}

/* -------------------------------- */
/* COMPONENTS */
/* -------------------------------- */

function Header({ user, image, email }: any) {

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">

      <img
        src={image}
        className="w-24 h-24 rounded-full border object-cover"
      />

      <div className="flex-1 text-center sm:text-left">

        <h1 className="text-2xl font-semibold">
          {user.name || "Your Account"}
        </h1>

        <p className="text-gray-500">
          {email}
        </p>

      </div>

      <button
        onClick={() => signOut()}
        className="text-sm text-red-500 hover:underline"
      >
        Logout
      </button>

    </div>
  );
}

/* -------------------------------- */

function Stats({ likes, comments }: any) {

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">

      <StatCard
        label="Liked Items"
        value={likes}
      />

      <StatCard
        label="Comments"
        value={comments}
      />

    </div>
  );
}

/* -------------------------------- */

function StatCard({ label, value }: any) {

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value}
      </p>

    </div>
  );
}

/* -------------------------------- */

function Tabs({ tab, setTab }: any) {

  const tabs = [
    "overview",
    "likes",
    "comments",
    "settings",
  ];

  return (
    <div className="mt-8 border-b flex gap-6">

      {tabs.map(t => (

        <button
          key={t}
          onClick={() => setTab(t)}
          className={`
            pb-3 capitalize text-sm font-medium
            ${
              tab === t
                ? "border-b-2 border-black text-black"
                : "text-gray-400 hover:text-black"
            }
          `}
        >
          {t}
        </button>

      ))}

    </div>
  );
}

/* -------------------------------- */

function Overview({
  user,
  setData,
  saving,
  save,
}: any) {

  return (
    <div className="max-w-lg space-y-5">

      <h2 className="text-lg font-semibold">
        Profile Information
      </h2>

      <Input
        label="Full Name"
        value={user.name || ""}
        onChange={(v: string) =>
          setData((d: any) => ({
            ...d,
            user: { ...d.user, name: v },
          }))
        }
      />

      <Input
        label="Phone Number"
        value={user.phone || ""}
        onChange={(v: string) =>
          setData((d: any) => ({
            ...d,
            user: { ...d.user, phone: v },
          }))
        }
      />

      <button
        disabled={saving}
        onClick={save}
        className="
          mt-2 px-6 py-2 rounded-lg
          bg-black text-white
          hover:opacity-90
          disabled:opacity-50
        "
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

    </div>
  );
}

/* -------------------------------- */

function Likes({ items }: any) {

  if (!items.length)
    return <Empty text="No liked items yet" />;

  return (
    <div className="grid sm:grid-cols-2 gap-4">

      {items.map((i: any) => (

        <a
          key={i.id}
          href={i.url}
          className="
            block border rounded-lg p-4
            hover:shadow-md transition
          "
        >
          <p className="font-medium">
            {i.title}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            View item →
          </p>

        </a>

      ))}

    </div>
  );
}

/* -------------------------------- */

function Comments({ items }: any) {

  if (!items.length)
    return <Empty text="No comments yet" />;

  return (
    <div className="space-y-4">

      {items.map((c: any, i: number) => (

        <div
          key={i}
          className="border rounded-lg p-4"
        >
          <a
            href={c.item.url}
            className="font-semibold"
          >
            {c.item.title}
          </a>

          <p className="mt-2 text-gray-600">
            {c.text}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {new Date(c.at).toLocaleString()}
          </p>

        </div>

      ))}

    </div>
  );
}

/* -------------------------------- */

function Settings() {

  return (
    <div className="space-y-4 max-w-md">

      <h2 className="font-semibold text-lg">
        Account Settings
      </h2>

      <p className="text-gray-500 text-sm">
        Advanced options will appear here.
      </p>

    </div>
  );
}

/* -------------------------------- */

function Loading() {

  return (
    <div className="h-screen flex items-center justify-center">

      <p className="text-gray-400">
        Loading dashboard...
      </p>

    </div>
  );
}

/* -------------------------------- */

function Empty({ text }: any) {

  return (
    <div className="py-12 text-center text-gray-400">

      {text}

    </div>
  );
}

/* -------------------------------- */

function Input({
  label,
  value,
  onChange,
}: any) {

  return (
    <div className="space-y-1">

      <label className="text-sm text-gray-600">
        {label}
      </label>

      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          w-full px-3 py-2 rounded-lg
          border focus:ring-2 focus:ring-black
          outline-none
        "
      />

    </div>
  );
}