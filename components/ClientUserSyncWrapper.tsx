// components/ClientUserSyncWrapper.tsx
"use client";

import { useUserSync } from "@/lib/useUserSync";

/**
 * Client-side wrapper to safely run useUserSync() in server components
 */
export const ClientUserSyncWrapper = () => {
  useUserSync(); // hook runs safely on client
  return null; // does not render anything
};