// lib/useUserSync.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

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
const loadQueue = (): Array<{
  email: string;
  name: string;
  photo: string;
}> => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save queue
const saveQueue = (
  queue: Array<{ email: string; name: string; photo: string }>
) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
};

// 👉 Call Next.js API (NOTGAS)
async function syncUser(user: {
  email: string;
  name: string;
  photo: string;
}) {
  const res = await fetch("/api/user-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    throw new Error("User sync failed");
  }

  return res.json();
}

export function useUserSync() {
  const { data: session, status } = useSession();

  const lastSyncedUser = useRef<{
    email: string;
    name: string;
    photo: string;
  } | null>(null);

  const pendingUser = useRef<{
    email: string;
    name: string;
    photo: string;
  } | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const queue = useRef(loadQueue());

  const processingQueue = useRef(false);

  // Process persistent queue
  const processQueue = async () => {
    if (processingQueue.current || !navigator.onLine) return;

    processingQueue.current = true;

    while (queue.current.length > 0 && navigator.onLine) {
      const userToSync = queue.current[0];

      try {
        await retry(() => syncUser(userToSync));

        console.log("✅ Queued user synced:", userToSync);

        queue.current.shift();
        saveQueue(queue.current);

      } catch (err) {
        console.error("❌ Failed to sync queued user", err);
        break;
      }
    }

    processingQueue.current = false;
  };

  // Main sync
  useEffect(() => {
    if (status !== "authenticated") return;

    const user = session?.user;
    if (!user?.email) return;

    const email = user.email;
    const name = user.name || "";
    const photo = user.image || "";

    // Prevent duplicate sync
    if (
      lastSyncedUser.current &&
      lastSyncedUser.current.email === email &&
      lastSyncedUser.current.name === name &&
      lastSyncedUser.current.photo === photo
    ) {
      return;
    }

    pendingUser.current = { email, name, photo };

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      if (!pendingUser.current) return;

      const userToSync = pendingUser.current;

      pendingUser.current = null;
      lastSyncedUser.current = userToSync;

      try {
        await retry(() => syncUser(userToSync));

        console.log("✅ User synced:", userToSync);

      } catch (err) {
        console.error("❌ User sync failed, queued", err);

        queue.current.push(userToSync);
        saveQueue(queue.current);

      } finally {
        processQueue();
      }
    }, 200);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [session, status]);

  // Retry every 5s
  useEffect(() => {
    const interval = setInterval(processQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Retry when online
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Online → retrying user sync");
      processQueue();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}