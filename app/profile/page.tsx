import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./logout-button";

async function getProfile() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/user-sync?me=1`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const data = await getProfile();

  if (!data?.ok) {
    return (
      <div className="p-6 text-red-500">
        User not found in database
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="max-w-2xl mx-auto p-6">

      <div className="flex items-center gap-4 mb-6">

        <img
          src={user.photo}
          className="w-16 h-16 rounded-full"
          alt=""
        />

        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">

        <div className="p-3 border rounded">
          <div className="font-bold">{stats.views}</div>
          <div>Views</div>
        </div>

        <div className="p-3 border rounded">
          <div className="font-bold">{stats.likes}</div>
          <div>Likes</div>
        </div>

        <div className="p-3 border rounded">
          <div className="font-bold">{stats.comments}</div>
          <div>Comments</div>
        </div>

      </div>

      <LogoutButton />

    </div>
  );
}