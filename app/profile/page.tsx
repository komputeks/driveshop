import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // SSR

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?size=128&font-size=0.5&bold=true&rounded=true&name={session.user?.name}&background=random";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // Not logged in → go to login
  if (!session) {
    redirect("/login");
  }

  const name = session.user?.name || "User";
  const email = session.user?.email || "";
  const image = session.user?.image || DEFAULT_AVATAR;

  return (
    <div className="pt-20 max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <img
          src={image}
          alt="Profile"
          className="w-28 h-28 rounded-full border shadow"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm">
        <p>
          <strong>Name:</strong> {name}
        </p>

        <p>
          <strong>Email:</strong> {email}
        </p>

        <p>
          <strong>Phone:</strong> Not set
        </p>

        <p>
          <strong>Role:</strong> User
        </p>
      </div>
    </div>
  );
}