import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // SSR

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login"); // fallback if not logged in
  }

  return (
    <div className="pt-20 max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="space-y-2">
        <p><strong>Name:</strong> {session.user?.name}</p>
        <p><strong>Email:</strong> {session.user?.email}</p>
        <p>
          <strong>Phone:</strong> {session.user?.phone || "Add phone"}
        </p>
        <p><strong>Role:</strong> {session.user?.role || "user"}</p>
      </div>
    </div>
  );
}