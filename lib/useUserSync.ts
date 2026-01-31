"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { callGAS } from "@/lib/api";

/**
 * Syncs authenticated user with Google Apps Script backend.
 *
 * - Runs only after login is ready
 * - Runs only once per session
 * - Prevents duplicate inserts
 * - Prevents undefined crashes
 * - Keeps Users sheet in sync
 */
export function useUserSync() {
  const { data: session, status } = useSession();

  // Prevent double sync (important for React strict mode)
  const hasSynced = useRef(false);

  useEffect(() => {
    // Wait until auth is fully loaded
    if (status !== "authenticated") return;

    // Already synced → stop
    if (hasSynced.current) return;

    // Safety check
    if (!session?.user?.email) {
      console.warn("User session incomplete, skipping sync");
      return;
    }

    // Mark as synced BEFORE calling API
    hasSynced.current = true;

    async function syncUser() {
      try {
        await callGAS("user", {
          email: session.user.email,
          name: session.user.name || "",
          photo: session.user.image || "",
        });

        console.log("User synced successfully");
      } catch (err) {
        console.error("User sync failed:", err);
      }
    }

    syncUser();
  }, [session, status]);
}