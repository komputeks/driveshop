import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Dashboard() {

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!API) {
    return (
      <p className="p-10 text-red-600">
        API not configured
      </p>
    );
  }

  const url = new URL(API);

  url.searchParams.set("path", "user/dashboard");
  url.searchParams.set("email", session.user.email);

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <p className="p-10 text-red-600">
        Failed to load dashboard
      </p>
    );
  }

  const data = await res.json();

  if (!data?.user) {
    return (
      <p className="p-10 text-red-600">
        Invalid dashboard data
      </p>
    );
  }

  return (
    <main className="pt-20 max-w-5xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="bg-white p-6 rounded shadow mb-8">

        <div className="flex items-center gap-4">

          <img
            src={session.user.image || ""}
            className="w-20 h-20 rounded-full"
          />

          <div>
            <h2 className="font-semibold text-lg">
              {data.user.name}
            </h2>

            <p className="text-gray-500">
              {data.user.email}
            </p>

            <p>{data.user.phone}</p>
          </div>

        </div>

      </div>

    </main>
  );
}