"use client";

import { useUserSync } from "@/lib/useUserSync";

export default function UserSyncGate() {
  useUserSync();
  return null;
}