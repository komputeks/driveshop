import Image from "next/image";
import { notFound } from "next/navigation";
import type { ApiResponse, User, ItemStats, EventWithUser } from "@/lib/types";

/* ======================
   TYPES
====================== */

type UserProfileResponse = ApiResponse<{
  user: User;
  stats: ItemStats;
  comments: EventWithUser[];
}>;

/* ======================
   DATA FETCH
====================== */

async function getUserProfile(email: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "user.profile",
        email,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return res.json() as Promise<UserProfileResponse>;
}

/* ======================
   PAGE
====================== */

export default async function ProfilePage({
  params,
}: {
  params: { email: string };
}) {
  const email = decodeURIComponent(params.email);

  const profile = await getUserProfile(email);

  if (!profile || !profile.ok) {
    notFound();
  }

  const { user, stats, comments } = profile;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* HEADER */}
      <section className="flex items-center gap-6">
        <Image
          src={user.photo || "/avatar.png"}
          alt={user.name || user.email}
          width={96}
          height={96}
          className="rounded-full"
        />

        <div>
          <h1 className="text-2xl font-bold">
            {user.name || "Anonymous"}
          </h1>

          <p className="text-sm text-gray-400">
            {user.email}
          </p>

          <p className="text-xs text-gray-500">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="flex gap-8 text-sm text-gray-300">
        <div>👍 {stats.likes} likes</div>
        <div>💬 {stats.comments} comments</div>
        <div>👁 {stats.views} views</div>
      </section>

      {/* COMMENTS */}
      <section>
        <h2 className="font-semibold mb-4">
          Recent comments
        </h2>

        {!comments.length && (
          <p className="text-sm text-gray-400">
            No comments yet
          </p>
        )}

        <ul className="space-y-4">
          {comments.map(c => (
            <li
              key={c.id}
              className="bg-white/5 p-4 rounded-xl text-sm"
            >
              <p className="mb-1">{c.value}</p>

              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* LOGOUT */}
      <section className="pt-6 border-t border-white/10">
        <a
          href="/api/auth/signout"
          className="inline-block text-sm text-red-400 hover:underline"
        >
          Logout
        </a>
      </section>

    </main>
  );
}
