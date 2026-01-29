import { callGas } from "@/lib/core";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await callGas("/admin/stats", {});

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <Card title="Items" value={stats.items} />
        <Card title="Events" value={stats.events} />
        <Card title="Users" value={stats.users} />
        <Card title="Errors" value={stats.errors} />

      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
      <p className="text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}