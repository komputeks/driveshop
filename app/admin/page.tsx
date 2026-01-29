import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminStats } from "@/lib/adminApi";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const stats = await getAdminStats(session.user.email);

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <StatCard
          title="Items"
          value={stats.items}
        />

        <StatCard
          title="Events"
          value={stats.events}
        />

        <StatCard
          title="Users"
          value={stats.users}
        />

        <StatCard
          title="Errors"
          value={stats.errors}
        />

      </div>

    </div>
  );
}

/* ================= Components ================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold mt-2">
        {value}
      </p>

    </div>
  );
}