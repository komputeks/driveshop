// lib/useUserSync.ts
// Sync logged-in user to GAS Users sheet

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { callGAS } from "@/lib/api";

export function useUserSync() {
  const { data: session, status } = useSession();

  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user) return;
    if (synced.current) return;

    synced.current = true;

    const sync = async () => {
      try {
        await callGAS("user", {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        });

        console.log("✅ User synced to GAS");
      } catch (err) {
        console.error("❌ User sync failed", err);
      }
    };

    sync();
  }, [session, status]);
}