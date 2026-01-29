import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className="pt-20 max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Profile</h1>

      <img
        src={session.user?.image || ""}
        className="w-24 h-24 rounded-full mx-auto"
      />

      <div className="mt-4 space-y-2 text-sm">
        <p><b>Name:</b> {session.user?.name}</p>
        <p><b>Email:</b> {session.user?.email}</p>

        <a
          href="/activity"
          className="text-blue-600 text-sm"
        >
          View Activity
        </a>
      </div>
    </div>
  );
}