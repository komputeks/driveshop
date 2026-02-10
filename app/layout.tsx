// app/layout.tsx
import MainLayout from "@/components/MainLayout";
import Providers from "@/providers/AuthProvider";
import "@/app/globals.css";
import type { Metadata } from "next";
import { ErrorCatcher } from "@/app/providers/ErrorCatcher";

export const metadata: Metadata = {
  title: "Simon Wokabi Codes",
  description: "Next.js 16 + React 19 + Tailwind v4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <Providers>
          <MainLayout>
            <ErrorCatcher />
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}