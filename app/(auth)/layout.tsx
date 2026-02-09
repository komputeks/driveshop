import AuthProvider from "@/providers/AuthProvider";
import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simon Wokabi Codes",
  description: "Next.js 16 + React 19 + Tailwind v4",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}