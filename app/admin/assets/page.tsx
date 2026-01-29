import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AssetsAdmin() {

  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (

    <div className="pt-20 max-w-6xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        Assets Moderation
      </h1>

      <p className="text-gray-500 mb-4">
        Review uploaded assets
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Assets from GAS */}

      </div>

    </div>
  );
}