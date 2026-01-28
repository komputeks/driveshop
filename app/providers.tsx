"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

/* ---------------- Sync Component ---------------- */

function GasSync() {
  const { data: session, status } = useSession();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user &&
      !syncedRef.current
    ) {
      syncedRef.current = true;

      syncUser(session.user);
    }
  }, [status, session]);

  async function syncUser(user: any) {
    try {
      await fetch(GAS_URL + "?path=user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          photo: user.image,
        }),
      });
    } catch (err) {
      console.error("GAS sync failed:", err);
    }
  }

  return null;
}

/* ---------------- Provider ---------------- */

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GasSync />
      {children}
    </SessionProvider>
  );
}