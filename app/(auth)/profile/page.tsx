import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import ProfileActivityTabs from "./ProfileActivityTabs";
import { UserActivity } from "@/lib/userActivityTypes";

export default async function ProfilePage() {
  // ✅ Get session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Not signed in</p>
      </main>
    );
  }

  // ✅ user is explicitly defined here
  const user = session.user;
  const handle = user.email?.split("@")[0]; // TEMP, public-safe

  // ✅ Fetch activity from API
  let activity: UserActivity | null = null;
  try {
    const activityRes = await fetch(
      `${process.env.NEXTAUTH_URL}/api/user/activity`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
        cache: "no-store",
      }
    );

    if (activityRes.ok) {
      activity = await activityRes.json();
    }
  } catch (err) {
    console.error("Failed to fetch user activity:", err);
  }
  
  console.log("activity", activity);
  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <section className="flex items-center gap-6">
        <Image
          src={user.image ?? "/avatar.png"}
          alt={user.name ?? "User"}
          width={96}
          height={96}
          className="rounded-full border border-white/10"
        />

        <div>
          <h1 className="text-2xl font-bold">{user.name || "Anonymous"}</h1>

          <p className="text-sm text-gray-400">{user.email}</p>

          {handle && (
            <a
              href={`/u/${handle}`}
              className="inline-block mt-2 text-sm text-blue-400 hover:underline"
            >
              View public profile →
            </a>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="flex items-center gap-4">
        <LogoutButton />
      </section>

      {/* Activity */}
      <ProfileActivityTabs activity={activity} />
    </main>
  );
}