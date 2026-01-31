"use client";

import { SessionProvider } from "next-auth/react";
import { useUserSync } from "@/lib/useUserSync";

/**
 * Global providers wrapper.
 *
 * - Provides NextAuth session
 * - Syncs user with GAS
 * - Central place for future global state
 */
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync logged-in user to GAS
  useUserSync();

  return <SessionProvider>{children}</SessionProvider>;
}