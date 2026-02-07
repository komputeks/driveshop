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
        <p className="text-sm muted">Not signed in</p>
      </main>
    );
  }

  const user = session.user;

  /* -----------------------------
     Fetch user activity
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
    <main className="py-12">
      <div className="container-page max-w-4xl stack">

        {/* Profile header */}
        <section className="card p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">

          <Image
            src={user.image ?? "/avatar.png"}
            alt={user.name ?? "User"}
            width={96}
            height={96}
            className="rounded-full border border-[rgb(var(--border))]"
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {user.name || "Anonymous"}
            </h1>
            <p className="text-sm muted truncate">
              {user.email}
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <LogoutButton />
          </div>
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