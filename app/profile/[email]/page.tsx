"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiResponse, User, ItemStats, EventWithUser } from "@/lib/types";

type UserProfileResponse = ApiResponse<{
  user: User;
  stats: ItemStats;
  comments: EventWithUser[];
}>;

// Utility to hide email domain
function hideEmailDomain(email: string) {
  const [local] = email.split("@");
  return local;
}

// Fetch profile data from GAS
async function getUserProfile(email: string): Promise<UserProfileResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=userProfile&email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function ProfilePage({ params }: { params: { email: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const email = params.email;

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch profile
  useEffect(() => {
    if (!email) return;

    setLoading(true);
    getUserProfile(email).then((res) => {
      setProfile(res);
      setLoading(false);
    });
  }, [email]);

  if (status === "loading" || loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!profile || !profile.ok) {
    return (
      <div className="p-8 text-center text-gray-400">
        User not found
      </div>
    );
  }

  const { user, stats, comments } = profile;

  const isOwnProfile = session?.user?.email === user.email;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <section className="flex gap-6 items-center">
        <Image
          src={user.photo || "/avatar.png"}
          alt={user.name || hideEmailDomain(user.email)}
          width={96}
          height={96}
          className="rounded-full"
        />

        <div>
          <h1 className="text-2xl font-bold">
            {user.name || hideEmailDomain(user.email) || "Anonymous"}
          </h1>

          <p className="text-sm text-gray-400">
            {isOwnProfile ? user.email : hideEmailDomain(user.email)}
          </p>

          <p className="text-xs text-gray-500">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-auto bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        )}
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

        {!comments.length && (
          <p className="text-sm text-gray-400">No comments yet</p>
        )}

        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="bg-white/5 p-4 rounded-xl text-sm">
              <p className="mb-1">{c.value}</p>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}