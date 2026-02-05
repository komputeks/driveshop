"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import useSWRMutation from "swr/mutation";

type LoginPayload = {
  name?: string;
  photo?: string;
};

async function sendLogin(_: string, { arg }: { arg: LoginPayload }) {
  const res = await fetch("/api/user-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    throw new Error("Login sync failed");
  }

  return res.json();
}

export function useUserSync() {
  const { data: session, status } = useSession();
  const lastSynced = useRef<string | null>(null);

  const { trigger } = useSWRMutation("/api/user-sync", sendLogin);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.email) return;

    const payload = {
      name: session.user.name || undefined,
      photo: session.user.image || undefined,
    };

    const fingerprint = JSON.stringify(payload);
    if (lastSynced.current === fingerprint) return;

    lastSynced.current = fingerprint;
    trigger(payload).catch(console.error);
  }, [session, status, trigger]);
}