import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserActivity } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function Activity() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const data = await getUserActivity(session.user.email);

  return (
    <div className="pt-20 max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">My Activity</h1>

      <ul className="space-y-2 text-sm">
        {data.map((e: any) => (
          <li key={e.id} className="border p-2 rounded">
            {e.type} — {e.itemId}
          </li>
        ))}
      </ul>
    </div>
  );
}