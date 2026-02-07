import "@/app/globals.css";
import AuthProvider from "@/app/(auth)/_providers/AuthProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}