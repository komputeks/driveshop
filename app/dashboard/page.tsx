import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  // Not logged in → login
  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email;

  // Call your internal API (NO CORS issues)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/user?email=${email}`,
    { cache: "no-store" }
  );

  let userData = null;

  if (res.ok) {
    userData = await res.json();
  }

  return (
    <DashboardClient
      sessionUser={session.user}
      userData={userData}
    />
  );
}