import ProfileActivityTabs from "./ProfileActivityTabs";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type {
  GetUserProfileResponse,
  UserActivityProfile,
} from "@/lib/types";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="muted text-sm">Not signed in</p>
      </main>
    );
  }

  const user = session.user;

  /* -----------------------------
     Fetch user activity (internal API)
  ----------------------------- */
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
    <main className="section">
      <div className="container space-y-10 max-w-4xl">

        {/* Profile header */}
        <section className="card p-6 flex items-center gap-6">

          <Image
            src={user.image ?? "/avatar.png"}
            alt={user.name ?? "User"}
            width={96}
            height={96}
            className="rounded-full border border-[rgb(var(--border))]"
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {user.name || "Anonymous"}
            </h1>
            <p className="text-sm muted truncate">
              {user.email}
            </p>
          </div>

          <LogoutButton />
        </section>

        {/* Activity */}
        {activity && (
          <section className="card p-6">
            <ProfileActivityTabs activity={activity} />
          </section>
        )}
      </div>
    </main>
  );
}