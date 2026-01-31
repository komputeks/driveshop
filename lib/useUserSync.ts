"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { callGAS } from "./callGAS";

export function useUserSync() {
  const { data: session, status } = useSession();

  // Prevent double sync
  const synced = useRef(false);

  useEffect(() => {
    // Wait until auth is ready
    if (status !== "authenticated") return;

    // Extra safety
    if (!session?.user?.email) return;

    if (synced.current) return;

    synced.current = true;

    async function sync() {
      try {
        await callGAS("user", {
          email: session.user.email,
          name: session.user.name || "",
          photo: session.user.image || "",
        });

        console.log("✅ User synced to GAS");
      } catch (err) {
        console.error("❌ User sync failed:", err);
        synced.current = false;
      }
    }

    sync();
  }, [session, status]);
}