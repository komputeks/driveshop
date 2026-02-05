"use client"; // make this client-rendered for logout & localStorage

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ApiResponse, User, ItemStats, EventWithUser } from "@/lib/types";

type UserProfileResponse = ApiResponse<{
  user: User;
  stats: ItemStats;
  comments: EventWithUser[];
}>;

async function getUserProfile(email: string): Promise<UserProfileResponse | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=userProfile&email=${encodeURIComponent(email)}`
  );
  if (!res.ok) return null;
  return res.json();
}

function getPublicName(email: string, name?: string) {
  if (name) return name;
  return email.split("@")[0]; // strip domain
}

export default function ProfilePage({ params }: { params: { email: string } }) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loggedEmail, setLoggedEmail] = useState<string | null>(null);

  // load logged-in email
  useEffect(() => {
    const e = localStorage.getItem("USER_EMAIL");
    setLoggedEmail(e);
  }, []);

  // fetch profile once loggedEmail is known
  useEffect(() => {
    const emailToFetch = loggedEmail || params.email;

    getUserProfile(emailToFetch).then(data => {
      setProfile(data);
    });
  }, [loggedEmail, params.email]);

  const handleLogout = () => {
    localStorage.removeItem("USER_EMAIL");
    setLoggedEmail(null);
    setProfile(null);
    window.location.href = "/"; // redirect after logout
  };

  if (!profile) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  if (!profile.ok) {
    return <div className="p-8 text-center text-gray-400">User not found</div>;
  }

  const { user, stats, comments } = profile;
  const isOwner = loggedEmail === user.email;
  const displayName = isOwner ? user.name || user.email : getPublicName(user.email, user.name);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <section className="flex gap-6 items-center">
        <Image
          src={user.photo || "/avatar.png"}
          alt={user.name || user.email}
          width={96}
          height={96}
          className="rounded-full"
        />

        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>

          {isOwner && <p className="text-sm text-gray-400">{user.email}</p>}

          <p className="text-xs text-gray-500">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>

          {isOwner && (
            <button
              onClick={handleLogout}
              className="mt-2 px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="flex gap-8 mt-8 text-sm">
        <div>👍 {stats.likes} likes</div>
        <div>💬 {stats.comments} comments</div>
        <div>👁 {stats.views} views</div>
      </section>

      {/* Comments */}
      <section className="mt-10">
        <h2 className="font-semibold mb-4">Recent comments</h2>

        {!comments.length ? (
          <p className="text-sm text-gray-400">No comments yet</p>
        ) : (
          <ul className="space-y-4">
            {comments.map(c => (
              <li key={c.id} className="bg-white/5 p-4 rounded-xl text-sm">
                <p className="mb-1">{c.value}</p>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}