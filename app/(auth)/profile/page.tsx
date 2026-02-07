import ProfileActivityTabs from "./ProfileActivityTabs";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import {
  GetUserProfileResponse,
  UserActivityProfile,
} from "@/lib/userActivityTypes";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Not signed in</p>
      </main>
    );
  }

  const user = session.user;

  // Fetch user activity
  const activityRes = await fetch(
    "https://driveshop-three.vercel.app/api/user/activity",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
      cache: "no-store",
    }
  );

  const activityData: GetUserProfileResponse = activityRes.ok
    ? await activityRes.json()
    : { ok: false, error: "Failed to load activity" };

  const activity: UserActivityProfile | null =
    activityData.ok ? activityData.data : null;

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
          <h1 className="text-2xl font-bold">
            {user.name || "Anonymous"}
          </h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </section>

      {/* Actions */}
      <section className="flex items-center gap-4">
        <LogoutButton />
      </section>

      {/* Activity Tabs */}
      {activity && <ProfileActivityTabs activity={activity} />}
    </main>
  );
}