"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import useSWRMutation from "swr/mutation";

/* ======================
   TYPES
====================== */

type LoginPayload = {
  action: "login";
  email: string;
  name?: string;
  photo?: string;
};

/* ======================
   STORAGE
====================== */

const STORAGE_KEY = "userSyncQueue";

const loadQueue = (): LoginPayload[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveQueue = (q: LoginPayload[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
};

/* ======================
   SWR MUTATION
====================== */

async function sendLogin(
  _: string,
  { arg }: { arg: LoginPayload }
) {
  const res = await fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    throw new Error("Login sync failed");
  }

  return res.json();
}

/* ======================
   HOOK
====================== */

export function useUserSync() {
  const { data: session, status } = useSession();

  const lastSynced = useRef<LoginPayload | null>(null);
  const queue = useRef<LoginPayload[]>(loadQueue());
  const processing = useRef(false);

  const { trigger } = useSWRMutation("/api/event", sendLogin);

  const processQueue = async () => {
    if (processing.current || !navigator.onLine) return;
    processing.current = true;

    while (queue.current.length > 0) {
      const payload = queue.current[0];

      try {
        await trigger(payload);
        queue.current.shift();
        saveQueue(queue.current);
      } catch {
        break;
      }
    }

    processing.current = false;
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const user = session?.user;
    if (!user?.email) return;

    const payload: LoginPayload = {
      action: "login",
      email: user.email,
      name: user.name || undefined,
      photo: user.image || undefined,
    };

    if (
      lastSynced.current &&
      JSON.stringify(lastSynced.current) === JSON.stringify(payload)
    ) {
      return;
    }

    lastSynced.current = payload;

    trigger(payload).catch(() => {
      queue.current.push(payload);
      saveQueue(queue.current);
    });
  }, [session, status, trigger]);

  // Retry queue
  useEffect(() => {
    const id = setInterval(processQueue, 5000);
    return () => clearInterval(id);
  }, []);

  // Retry on reconnect
  useEffect(() => {
    const onOnline = () => processQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
}