import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import LoginClient from "./ui";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If already logged in → redirect
  if (session) {
    if (session.user?.role === "admin") {
      redirect("/admin/dashboard");
    } else {
      redirect("/profile");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <LoginClient />
    </div>
  );
}