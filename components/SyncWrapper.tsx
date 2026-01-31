// components/SyncWrapper.tsx
"use client";

import { useUserSync } from "@/lib/useUserSync";

export default function SyncWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useUserSync(); // ✅ safe, runs on client
  return <>{children}</>;
}