// lib/useUserSync.ts
// 💥 Ultimate: debounced + batched + retry + queued + persistent + offline-aware
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { callGAS } from "@/lib/api";

const LOCAL_STORAGE_KEY = "userSyncQueue";

// Retry helper
const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying... attempts left: ${retries}`, err);
      await new Promise((res) => setTimeout(res, delay));
      return retry(fn, retries - 1, delay);
    }
    throw err;
  }
};

// Load queue from localStorage
const loadQueue = (): Array<{ email: string; name: string; image: string }> => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save queue to localStorage
const saveQueue = (queue: Array<{ email: string; name: string; image: string }>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
};

export function useUserSync() {
  const { data: session, status } = useSession();

  const lastSyncedUser = useRef<{ email: string; name: string; image: string } | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingUser = useRef<{ email: string; name: string; image: string } | null>(null);

  const queue = useRef(loadQueue());
  const processingQueue = useRef(false);

  const processQueue = async () => {
    if (processingQueue.current || !navigator.onLine) return;
    processingQueue.current = true;

    while (queue.current.length > 0 && navigator.onLine) {
      const userToSync = queue.current[0];
      try {
        await retry(() => callGAS("user", userToSync), 3, 500);
        console.log("✅ Queued user synced to GAS:", userToSync);
        queue.current.shift();
        saveQueue(queue.current);
      } catch (err) {
        console.error("❌ Failed to sync queued user, will retry later", err);
        break; // stop processing queue to retry later
      }
    }

    processingQueue.current = false;
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const user = session?.user;
    if (!user) return;

    // ⚡ TypeScript-safe defaults to fix null | string issue
    const email = user.email ?? "";
    const name = user.name ?? "";
    const image = user.image ?? "";

    // Skip if nothing changed
    if (
      lastSyncedUser.current &&
      lastSyncedUser.current.email === email &&
      lastSyncedUser.current.name === name &&
      lastSyncedUser.current.image === image
    ) {
      return;
    }

    pendingUser.current = { email, name, image };

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      if (!pendingUser.current) return;

      const userToSync = pendingUser.current;
      pendingUser.current = null;

      lastSyncedUser.current = userToSync;

      try {
        await retry(() => callGAS("user", userToSync), 3, 500);
        console.log("✅ User synced to GAS:", userToSync);
      } catch (err) {
        console.error("❌ User sync failed, added to persistent queue", err);
        queue.current.push(userToSync);
        saveQueue(queue.current);
      } finally {
        processQueue();
      }
    }, 200);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [session, status]);

  // Retry queue every 5s if online
  useEffect(() => {
    const interval = setInterval(() => {
      processQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Retry queue when browser comes online
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Browser online, processing user sync queue...");
      processQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}