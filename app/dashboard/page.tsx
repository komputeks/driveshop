import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <DashboardClient
      email={session.user.email}
      image={session.user.image}
    />
  );
}